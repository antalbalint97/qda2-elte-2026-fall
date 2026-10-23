"use client";

// Instructor-authored explanatory text from a course snapshot. Paragraphs are separated by blank lines; a
// paragraph written as $$ … $$ is display mathematics, typeset by KaTeX (loaded only when a lesson has some).
// Everything else is rendered as text nodes, never as HTML. KaTeX runs with trust disabled, so commands that
// could add links or HTML attributes are refused, and a malformed formula is shown as its source.
import "katex/dist/katex.min.css";
import { useEffect, useState } from "react";

type Segment = { kind: "p"; text: string } | { kind: "math"; tex: string };

export function parseCourseText(body: string): Segment[] {
  return body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => {
      const m = /^\$\$([\s\S]+)\$\$$/.exec(p);
      return m ? { kind: "math" as const, tex: m[1].trim() } : { kind: "p" as const, text: p };
    });
}

function MathBlock({ tex }: { tex: string }) {
  const [html, setHtml] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    import("katex")
      .then(({ default: katex }) => {
        if (live) setHtml(katex.renderToString(tex, { displayMode: true, throwOnError: false, trust: false, strict: "ignore", maxExpand: 200, output: "htmlAndMathml" }));
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [tex]);
  return html ? (
    // KaTeX output (trust: false) is the only HTML rendered from course content
    <div tabIndex={0} role="group" aria-label="formula" className="overflow-x-auto rounded-xl border border-line bg-surface-2 px-4 py-1 text-ink" dangerouslySetInnerHTML={{ __html: html }} />
  ) : (
    <pre className="overflow-x-auto rounded-xl border border-line bg-surface-2 px-4 py-3 font-mono text-sm text-ink">{tex}</pre>
  );
}

export function CourseText({ body, className }: { body: string; className?: string }) {
  return (
    <div className={className ?? "space-y-3 leading-relaxed text-ink"}>
      {parseCourseText(body).map((s, i) =>
        s.kind === "math" ? (
          <MathBlock key={i} tex={s.tex} />
        ) : (
          <p key={i} className="whitespace-pre-line">
            {s.text}
          </p>
        ),
      )}
    </div>
  );
}
