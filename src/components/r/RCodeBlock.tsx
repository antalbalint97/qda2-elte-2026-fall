"use client";

// An R code block: editor, Run / Stop / Reset, status, text output and plots. R runs in the page's webR worker
// (src/lib/r/webr-adapter.ts). Output is rendered as text nodes and plots as PNG images drawn from the worker's
// bitmaps, so nothing R prints is ever interpreted as HTML or script.
import { LabButton } from "@/components/lab/primitives/controls";
import type { Dataset, Lang } from "@/content/curriculum/types";
import { cn } from "@/lib/cn";
import { rRuntime, type RLine, type RStatus, type RunResult } from "@/lib/r/webr-adapter";
import { useEffect, useRef, useState } from "react";
import { CodeEditor } from "./CodeEditor";

const T = {
  en: {
    editor: "R code",
    run: "Run",
    stop: "Stop",
    reset: "Reset code",
    status: { idle: "R not started (it loads on the first run, about 10 MB once)", loading: "Starting R…", ready: "R ready", running: "Running…", installing: "Installing package {p}…", failed: "R could not be started: {p}" } as Record<RStatus, string>,
    output: "Output",
    noOutput: "The code ran without printing anything.",
    plot: "Plot {i} produced by the R code",
    truncated: "Output was cut at the display limit.",
    timedOut: "The run hit the time limit. R was restarted, so earlier objects are gone.",
    stopped: "Stopped. R was restarted, so earlier objects are gone.",
    refused: "Not run: {p}",
    took: "finished in {p} s",
    shortcut: "Ctrl/⌘ + Enter runs the code.",
  },
  hu: {
    editor: "R-kód",
    run: "Futtatás",
    stop: "Leállítás",
    reset: "Kód visszaállítása",
    status: { idle: "Az R még nem indult el (az első futtatáskor töltődik be, egyszer kb. 10 MB)", loading: "Az R indul…", ready: "Az R kész", running: "Fut…", installing: "Csomag telepítése: {p}…", failed: "Az R nem indult el: {p}" } as Record<RStatus, string>,
    output: "Kimenet",
    noOutput: "A kód lefutott, de nem írt ki semmit.",
    plot: "Az R-kód {i}. ábrája",
    truncated: "A kimenetet a megjelenítési korlátnál levágtuk.",
    timedOut: "A futás elérte az időkorlátot. Az R újraindult, a korábbi objektumok elvesztek.",
    stopped: "Leállítva. Az R újraindult, a korábbi objektumok elvesztek.",
    refused: "Nem futott le: {p}",
    took: "{p} mp alatt lefutott",
    shortcut: "Ctrl/⌘ + Enter futtatja a kódot.",
  },
};
const fill = (s: string, p: string | number) => s.replace("{p}", String(p)).replace("{i}", String(p));

const LINE_CLASS: Record<RLine["kind"], string> = {
  stdout: "text-ink",
  stderr: "text-muted",
  message: "text-muted",
  warning: "text-[var(--y-ink)]",
  error: "text-[var(--warn)] font-medium",
};

function bitmapToPng(b: ImageBitmap): string {
  const c = document.createElement("canvas");
  c.width = b.width;
  c.height = b.height;
  c.getContext("2d")?.drawImage(b, 0, 0);
  b.close();
  return c.toDataURL("image/png");
}

export interface RShownResult extends Omit<RunResult, "images"> {
  plots: string[];
}

export function RCodeBlock({
  initialCode,
  lang = "en",
  datasets = [],
  packages = [],
  editable = true,
  label,
  onResult,
  className,
}: {
  initialCode: string;
  lang?: Lang;
  datasets?: readonly Dataset[];
  packages?: readonly string[];
  editable?: boolean;
  label?: string;
  onResult?: (r: RShownResult, code: string) => void;
  className?: string;
}) {
  const t = T[lang];
  const [code, setCode] = useState(initialCode);
  const [status, setStatus] = useState<RStatus>("idle");
  const [detail, setDetail] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<RShownResult | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    const off = rRuntime().subscribe((s, d) => {
      setStatus(s);
      setDetail(d ?? "");
    });
    return () => {
      mounted.current = false;
      off();
    };
  }, []);
  useEffect(() => setCode(initialCode), [initialCode]);

  const run = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const r = await rRuntime().run(code, { datasets, packages });
      const shown: RShownResult = { ...r, plots: r.images.map(bitmapToPng) };
      if (!mounted.current) return;
      setResult(shown);
      onResult?.(shown, code);
    } finally {
      if (mounted.current) setBusy(false);
    }
  };

  const statusText = fill(t.status[status], detail);
  return (
    <div className={cn("space-y-2", className)} lang={lang}>
      <CodeEditor value={code} onChange={setCode} onRun={run} label={label ?? t.editor} readOnly={!editable} />
      <div className="flex flex-wrap items-center gap-2">
        <LabButton variant="primary" onClick={run} disabled={busy}>
          {t.run}
        </LabButton>
        <LabButton onClick={() => rRuntime().stop()} disabled={!busy}>
          {t.stop}
        </LabButton>
        {editable && (
          <LabButton onClick={() => setCode(initialCode)} disabled={busy || code === initialCode}>
            {t.reset}
          </LabButton>
        )}
        <span className="text-xs text-muted" role="status" aria-live="polite" data-testid="r-status">
          {statusText}
        </span>
      </div>
      <p className="text-xs text-faint">{t.shortcut}</p>
      {result && (
        <section aria-label={t.output} data-testid="r-output" className="rounded-lg border border-line bg-surface-2 p-3">
          {result.refused ? (
            <p className="text-sm text-[var(--warn)]">{fill(t.refused, result.refused)}</p>
          ) : result.timedOut ? (
            <p className="text-sm text-muted">{t.timedOut}</p>
          ) : result.stopped ? (
            <p className="text-sm text-muted">{t.stopped}</p>
          ) : (
            <>
              {result.lines.length > 0 ? (
                <pre tabIndex={0} aria-label={t.output} className="max-h-96 overflow-auto whitespace-pre-wrap font-mono text-[13px] leading-snug">
                  {result.lines.map((l, i) => (
                    <span key={i} className={cn("block", LINE_CLASS[l.kind])} data-kind={l.kind}>
                      {l.text || " "}
                    </span>
                  ))}
                </pre>
              ) : (
                result.plots.length === 0 && <p className="text-sm text-muted">{t.noOutput}</p>
              )}
              {result.plots.map((src, i) => (
                // eslint-disable-next-line @next/next/no-img-element -- a data URL drawn from R's own bitmap
                <img key={i} src={src} alt={fill(t.plot, i + 1)} className="mt-2 max-w-full rounded border border-line bg-white" data-testid="r-plot" />
              ))}
              {result.truncated && <p className="mt-1 text-xs text-muted">{t.truncated}</p>}
              <p className="mt-1 text-xs text-faint">{fill(t.took, (result.ms / 1000).toFixed(1))}</p>
            </>
          )}
        </section>
      )}
    </div>
  );
}
