// Browser R: one lazily started webR runtime per page (a Web Worker running R compiled to WebAssembly).
// The runtime files are self-hosted under /webr/<version>/ (scripts/copy-webr.mjs); R packages can only come
// from the webR package repository, and only the allow-listed ones are installed on request. Code is R and
// runs in the worker; nothing here evaluates text as JavaScript, and output reaches the page as plain text and
// bitmaps. The PostMessage channel is used (no cross-origin isolation headers needed), so a running
// computation cannot be interrupted: Stop and the timeout terminate the worker and start a fresh R.
import type { Dataset } from "@/content/curriculum/types";
import { datasetR, rName } from "@/content/curriculum/datasets";
import { WEBR_REPO } from "@/lib/security-headers";
import type { WebR } from "webr";

export const WEBR_VERSION = "0.4.2";
export const LIMITS = {
  codeChars: 20_000,
  outputLines: 2_000,
  plots: 8,
  timeoutMs: 60_000,
  datasetRows: 5_000,
  plotWidth: 640,
  plotHeight: 440,
} as const;
/** Packages a block may ask for; each is fetched from the webR package repository on first use. */
export const ALLOWED_PACKAGES = ["survey"] as const;
export type AllowedPackage = (typeof ALLOWED_PACKAGES)[number];

export type RStatus = "idle" | "loading" | "ready" | "running" | "installing" | "failed";
export type LineKind = "stdout" | "stderr" | "message" | "warning" | "error";
export interface RLine {
  kind: LineKind;
  text: string;
}
export interface RunResult {
  lines: RLine[];
  images: ImageBitmap[];
  /** Output lines or plots beyond the limits were dropped. */
  truncated: boolean;
  /** The run hit the time limit; R was restarted and its state lost. */
  timedOut: boolean;
  /** The run was stopped by the user; R was restarted. */
  stopped: boolean;
  /** A refusal before running (too long, package not allowed, runtime failed to load). */
  refused: string | null;
  /** True when an R error condition was raised. */
  error: boolean;
  ms: number;
}

const IDENT = /^[A-Za-z.][A-Za-z0-9._]{0,39}$/;
const emptyResult = (over: Partial<RunResult>): RunResult => ({ lines: [], images: [], truncated: false, timedOut: false, stopped: false, refused: null, error: false, ms: 0, ...over });

/** Resolves with the promise, or with `onTimeout()` after `ms`; the timer is always cleared. */
export async function withTimeout<T>(p: Promise<T>, ms: number, onTimeout: () => T): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const t = new Promise<T>((resolve) => {
    timer = setTimeout(() => resolve(onTimeout()), ms);
  });
  try {
    return await Promise.race([p, t]);
  } finally {
    clearTimeout(timer);
  }
}

/** Splits captured output into lines and enforces the line limit. */
export function limitLines(lines: RLine[], max: number = LIMITS.outputLines): { lines: RLine[]; truncated: boolean } {
  const out: RLine[] = [];
  for (const l of lines) for (const text of l.text.split("\n")) out.push({ kind: l.kind, text });
  return out.length > max ? { lines: out.slice(0, max), truncated: true } : { lines: out, truncated: false };
}

/** Checks a block's code before it reaches R. */
export function refuseCode(code: string): string | null {
  if (code.length > LIMITS.codeChars) return `code is longer than ${LIMITS.codeChars} characters`;
  return null;
}
/** True when the code loads or calls the package (library/require/requireNamespace or pkg::), so a block only downloads what its current code uses. */
export function usesPackage(code: string, pkg: string): boolean {
  const p = pkg.replace(/[.]/g, "\\.");
  return new RegExp(`(library|require|requireNamespace)\\s*\\(\\s*["']?${p}["']?\\s*[,)]|\\b${p}:::?`).test(code.replace(/#.*$/gm, ""));
}
export const isAllowedPackage = (p: string): p is AllowedPackage => (ALLOWED_PACKAGES as readonly string[]).includes(p);

type Listener = (s: RStatus, detail?: string) => void;

class RRuntime {
  private webR: WebR | null = null;
  private starting: Promise<WebR> | null = null;
  private installed = new Set<string>();
  private bound = new Set<string>();
  private listeners = new Set<Listener>();
  private abort: (() => void) | null = null;
  status: RStatus = "idle";
  detail = "";

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    fn(this.status, this.detail);
    return () => this.listeners.delete(fn);
  }
  private set(s: RStatus, detail = "") {
    this.status = s;
    this.detail = detail;
    for (const fn of this.listeners) fn(s, detail);
  }

  /** Starts R on first use (downloads the runtime once; the browser caches it). */
  async ensure(): Promise<WebR> {
    if (this.webR) return this.webR;
    if (!this.starting) {
      this.set("loading");
      this.starting = (async () => {
        const { WebR, ChannelType } = await import("webr");
        const w = new WebR({
          baseUrl: `/webr/${WEBR_VERSION}/`,
          repoUrl: `${WEBR_REPO}/`,
          channelType: ChannelType.PostMessage,
          interactive: false,
        });
        await w.init();
        this.webR = w;
        this.installed.clear();
        this.bound.clear();
        this.set("ready");
        return w;
      })().catch((e: unknown) => {
        this.starting = null;
        this.set("failed", e instanceof Error ? e.message : String(e));
        throw e;
      });
    }
    return this.starting;
  }

  /** Terminates the worker (the only way to stop R on the PostMessage channel); the next run starts afresh. */
  restart() {
    try {
      this.webR?.close();
    } catch {
      /* already closed */
    }
    this.webR = null;
    this.starting = null;
    this.installed.clear();
    this.bound.clear();
    this.set("idle");
  }

  /** Stops a running computation. */
  stop() {
    this.abort?.();
  }

  /** Clears the global environment (used between lessons) without restarting R. */
  async reset() {
    if (!this.webR || this.status === "running") return;
    await this.webR.evalRVoid("rm(list = ls(all.names = TRUE), envir = globalenv())");
    this.bound.clear();
  }

  async installPackages(pkgs: readonly string[]): Promise<string | null> {
    const bad = pkgs.filter((p) => !isAllowedPackage(p));
    if (bad.length) return `package not allowed: ${bad.join(", ")}`;
    const need = pkgs.filter((p) => !this.installed.has(p));
    if (!need.length) return null;
    const w = await this.ensure();
    this.set("installing", need.join(", "));
    try {
      await w.installPackages([...need], { quiet: true });
      // webR reports a failed download only as a message, so check that each package can actually be loaded
      const missing: string[] = [];
      for (const p of need) {
        if (await w.evalRBoolean(`requireNamespace("${p}", quietly = TRUE)`)) this.installed.add(p);
        else missing.push(p);
      }
      return missing.length ? `package ${missing.join(", ")} could not be installed (is ${WEBR_REPO} reachable from this network?)` : null;
    } catch (e) {
      return e instanceof Error ? e.message : String(e);
    } finally {
      this.set("ready");
    }
  }

  /** Makes a course dataset available as a data.frame named rName(id). */
  async bindDataset(ds: Pick<Dataset, "id" | "title" | "provenance" | "columns" | "rows">): Promise<string | null> {
    if (ds.rows.length > LIMITS.datasetRows) return `dataset has more than ${LIMITS.datasetRows} rows`;
    const name = rName(ds.id);
    if (!IDENT.test(name) || !ds.columns.every((c) => IDENT.test(c.name))) return "dataset or column name is not a safe R identifier";
    if (this.bound.has(ds.id)) return null;
    const w = await this.ensure();
    await w.evalRVoid(datasetR(ds, name));
    this.bound.add(ds.id);
    return null;
  }

  /** Runs R code with output, conditions and plots captured. */
  async run(code: string, opts: { packages?: readonly string[]; datasets?: readonly Dataset[]; timeoutMs?: number } = {}): Promise<RunResult> {
    const refusal = refuseCode(code);
    if (refusal) return emptyResult({ refused: refusal });
    const t0 = performance.now();
    let w: WebR;
    try {
      w = await this.ensure();
    } catch (e) {
      return emptyResult({ refused: `R could not be started: ${e instanceof Error ? e.message : String(e)}` });
    }
    const packages = (opts.packages ?? []).filter((p) => usesPackage(code, p));
    if (packages.length) {
      const err = await this.installPackages(packages);
      if (err) return emptyResult({ refused: err });
    }
    for (const ds of opts.datasets ?? []) {
      const err = await this.bindDataset(ds);
      if (err) return emptyResult({ refused: err });
    }
    this.set("running");
    const shelter = await new w.Shelter();
    let ended: "stopped" | "timeout" | null = null;
    const stopped = new Promise<null>((resolve) => {
      this.abort = () => {
        ended = "stopped";
        resolve(null);
      };
    });
    try {
      const captured = await withTimeout(
        Promise.race([
          shelter.captureR(code, {
            withAutoprint: true,
            captureStreams: true,
            captureConditions: true,
            captureGraphics: { width: LIMITS.plotWidth, height: LIMITS.plotHeight },
            throwJsException: false,
          }),
          stopped,
        ]),
        opts.timeoutMs ?? LIMITS.timeoutMs,
        () => {
          ended = "timeout";
          return null;
        },
      );
      if (!captured || ended) {
        this.restart();
        return emptyResult({ timedOut: ended === "timeout", stopped: ended === "stopped", ms: performance.now() - t0 });
      }
      const raw: RLine[] = [];
      let error = false;
      for (const o of captured.output) {
        if (o.type === "stdout" || o.type === "stderr") raw.push({ kind: o.type, text: String(o.data) });
        else if (o.type === "message" || o.type === "warning" || o.type === "error") {
          if (o.type === "error") error = true;
          let msg = "";
          try {
            msg = String(await (await o.data.get("message")).toJs().then((x: { values?: unknown[] }) => x.values?.[0] ?? ""));
          } catch {
            msg = o.type;
          }
          raw.push({ kind: o.type, text: o.type === "message" ? msg.replace(/\n$/, "") : `${o.type === "error" ? "Error" : "Warning"}: ${msg}` });
        }
      }
      const { lines, truncated } = limitLines(raw);
      const images = captured.images.slice(0, LIMITS.plots);
      for (const extra of captured.images.slice(LIMITS.plots)) extra.close();
      this.set("ready");
      return emptyResult({ lines, images, truncated: truncated || captured.images.length > LIMITS.plots, error, ms: performance.now() - t0 });
    } finally {
      this.abort = null;
      if (this.webR) {
        try {
          await shelter.purge();
        } catch {
          /* worker gone */
        }
        if (this.status === "running") this.set("ready");
      }
    }
  }
}

let runtime: RRuntime | null = null;
/** The page's R runtime (client side only). */
export function rRuntime(): RRuntime {
  if (typeof window === "undefined") throw new Error("browser R runs only in the browser");
  runtime ??= new RRuntime();
  return runtime;
}
export type { RRuntime };
