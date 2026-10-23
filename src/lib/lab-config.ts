// Lab configuration ↔ URL hash. Contract (V3 docs/14): location.hash = "#" + encodeURIComponent(JSON) of a
// LabConfiguration: { l, present, controls: { locked[] }, instructions, ...lab params }. The VRA lab keeps its
// legacy query-style hash ("#s=2&l=en&p=ols…") so existing links (/lab#s=1, /lab#s=3) keep working.
//
// Everything that arrives through a URL is untrusted: keys that the lab does not declare are dropped, values
// are type-checked against LabDefinition.params, and text is length-capped and stripped of control
// characters. The config only changes what the UI shows; it never reaches an estimator formula.
import type { Lang, LabParam } from "../content/curriculum/types";

export interface LabConfiguration {
  l?: Lang;
  present?: boolean;
  controls?: { locked: string[] };
  instructions?: string;
  [param: string]: unknown;
}

export const MAX_HASH_LENGTH = 16_000;
export const MAX_INSTRUCTIONS = 1_200;
const MAX_STRING = 400;
const MAX_ARRAY = 200;

const CONTROL_CHARS = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g;
export const cleanText = (s: string, max: number) => s.replace(CONTROL_CHARS, "").slice(0, max);

/** Parses a JSON hash. Returns null when the hash is empty, not JSON, too long or not an object. */
export function decodeJsonHash(hash: string): Record<string, unknown> | null {
  const raw = hash.startsWith("#") ? hash.slice(1) : hash;
  if (!raw || raw.length > MAX_HASH_LENGTH) return null;
  let text: string;
  try {
    text = decodeURIComponent(raw);
  } catch {
    return null;
  }
  if (!text.startsWith("{")) return null;
  try {
    const v: unknown = JSON.parse(text);
    return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export function encodeJsonHash(config: LabConfiguration): string {
  return "#" + encodeURIComponent(JSON.stringify(config));
}

function isPlainJson(v: unknown, depth = 0): boolean {
  if (depth > 4) return false;
  if (v === null || typeof v === "boolean" || typeof v === "string") return true;
  if (typeof v === "number") return Number.isFinite(v);
  if (Array.isArray(v)) return v.length <= MAX_ARRAY && v.every((x) => isPlainJson(x, depth + 1));
  if (typeof v === "object") {
    const keys = Object.keys(v as object);
    return keys.length <= 50 && keys.every((k) => k !== "__proto__" && k !== "constructor" && isPlainJson((v as Record<string, unknown>)[k], depth + 1));
  }
  return false;
}

/** Validates one parameter value against its declared type; returns undefined when it is not acceptable. */
export function coerceParam(p: LabParam, v: unknown): unknown {
  switch (p.type) {
    case "enum": {
      const opts = p.options ?? [];
      // Options may be numbers (stage 1|2|3); accept their string spelling too.
      const hit = opts.find((o) => o === v || String(o) === String(v));
      return hit;
    }
    case "boolean":
      return typeof v === "boolean" ? v : v === "true" || v === 1 ? true : v === "false" || v === 0 ? false : undefined;
    case "int": {
      const x = typeof v === "string" && v.trim() !== "" ? Number(v) : v;
      return typeof x === "number" && Number.isInteger(x) && Math.abs(x) <= 1e9 ? x : undefined;
    }
    case "float": {
      const x = typeof v === "string" && v.trim() !== "" ? Number(v) : v;
      return typeof x === "number" && Number.isFinite(x) ? x : undefined;
    }
    case "string":
      return typeof v === "string" ? cleanText(v, MAX_STRING) : undefined;
    case "range":
      return Array.isArray(v) && v.length === 2 && v.every((x) => typeof x === "number" && Number.isFinite(x)) && (v[0] as number) <= (v[1] as number) ? [v[0], v[1]] : undefined;
    case "array":
      return Array.isArray(v) && isPlainJson(v) ? v : undefined;
    case "object":
      return v && typeof v === "object" && !Array.isArray(v) && isPlainJson(v) ? v : undefined;
  }
}

export interface SanitizedConfig {
  config: LabConfiguration;
  /** Keys that were present but rejected (unknown key or invalid value), for a visible notice. */
  rejected: string[];
}

/** Keeps only the shell keys and declared params, each validated. */
export function sanitizeConfig(raw: Record<string, unknown> | null, params: LabParam[]): SanitizedConfig {
  const config: LabConfiguration = {};
  const rejected: string[] = [];
  if (!raw) return { config, rejected };
  const byKey = new Map(params.map((p) => [p.key, p]));
  for (const [k, v] of Object.entries(raw)) {
    if (k === "l") {
      if (v === "en" || v === "hu") config.l = v;
      else rejected.push(k);
    } else if (k === "present") {
      if (typeof v === "boolean") config.present = v;
      else rejected.push(k);
    } else if (k === "instructions") {
      if (typeof v === "string") config.instructions = cleanText(v, MAX_INSTRUCTIONS);
      else rejected.push(k);
    } else if (k === "controls") {
      const locked = v && typeof v === "object" ? (v as { locked?: unknown }).locked : undefined;
      if (Array.isArray(locked)) config.controls = { locked: locked.filter((x): x is string => typeof x === "string" && byKey.has(x)) };
      else rejected.push(k);
    } else {
      const p = byKey.get(k);
      const val = p ? coerceParam(p, v) : undefined;
      if (val === undefined) rejected.push(k);
      else config[k] = val;
    }
  }
  return { config, rejected };
}

// ── VRA legacy hash ─────────────────────────────────────────────────────────────

export interface VraHashState {
  stage?: 1 | 2 | 3;
  lang?: Lang;
  pred?: "mean" | "custom" | "ols";
  layer?: 1 | 2 | 3 | 4 | 5;
  scenario?: "base" | "flat" | "noisy" | "steep";
  mode?: "explore" | "learn";
  av?: "total" | "within" | "between" | "both";
  showSq?: boolean;
  popVar?: boolean;
  compare?: boolean;
  present?: boolean;
  y?: number[];
  x?: number[];
  g?: number[];
}

const oneOf = <T extends string | number>(v: string | null, opts: readonly T[]): T | undefined => (v === null ? undefined : opts.find((o) => String(o) === v));
const listOf = (v: string | null, n: number, ok: (x: number) => boolean): number[] | undefined => {
  if (!v) return undefined;
  const xs = v.split(",").slice(0, n).map(Number);
  return xs.length === n && xs.every((x) => Number.isFinite(x) && ok(x)) ? xs : undefined;
};

/** Parses "#s=2&l=en&p=ols&ly=2&sc=base&m=learn&av=both&sq=1&pv=0&cmp=1&present=1&y=…&x=…&g=…". */
export function parseVraHash(hash: string, n = 15): VraHashState | null {
  const raw = hash.startsWith("#") ? hash.slice(1) : hash;
  if (!raw || raw.startsWith("%7B") || raw.startsWith("{") || raw.length > MAX_HASH_LENGTH) return null;
  const h = new URLSearchParams(raw);
  if (!h.has("s")) return null;
  const bool = (k: string) => (h.has(k) ? h.get(k) !== "false" && h.get(k) !== "0" : undefined);
  return {
    stage: oneOf(h.get("s"), [1, 2, 3] as const),
    lang: oneOf(h.get("l"), ["en", "hu"] as const),
    pred: oneOf(h.get("p"), ["mean", "custom", "ols"] as const),
    layer: oneOf(h.get("ly"), [1, 2, 3, 4, 5] as const),
    scenario: oneOf(h.get("sc"), ["base", "flat", "noisy", "steep"] as const),
    mode: oneOf(h.get("m"), ["explore", "learn"] as const),
    av: oneOf(h.get("av"), ["total", "within", "between", "both"] as const),
    showSq: bool("sq"),
    popVar: bool("pv"),
    compare: bool("cmp"),
    present: bool("present"),
    y: listOf(h.get("y"), n, (x) => x >= 0 && x <= 100),
    x: listOf(h.get("x"), n, (x) => x >= 0 && x <= 14),
    g: listOf(h.get("g"), n, (x) => x === 0 || x === 1 || x === 2),
  };
}

export function encodeVraHash(s: Required<Pick<VraHashState, "stage" | "lang" | "pred" | "layer" | "scenario" | "av">> & VraHashState): string {
  const q = new URLSearchParams();
  q.set("s", String(s.stage));
  q.set("l", s.lang);
  q.set("p", s.pred);
  q.set("ly", String(s.layer));
  q.set("sc", s.scenario);
  q.set("av", s.av);
  if (s.mode) q.set("m", s.mode);
  if (s.showSq !== undefined) q.set("sq", s.showSq ? "1" : "0");
  if (s.popVar !== undefined) q.set("pv", s.popVar ? "1" : "0");
  if (s.compare !== undefined) q.set("cmp", s.compare ? "1" : "0");
  if (s.present) q.set("present", "1");
  if (s.y) q.set("y", s.y.join(","));
  if (s.x) q.set("x", s.x.join(","));
  if (s.g) q.set("g", s.g.join(","));
  // URLSearchParams escapes commas; keep the hash readable and identical to the prototype's format.
  return "#" + q.toString().replace(/%2C/g, ",");
}
