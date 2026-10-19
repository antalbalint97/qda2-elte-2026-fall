import { cn } from "@/lib/cn";
import katex from "katex";
import "katex/dist/katex.min.css";

function render(tex: string, display: boolean) {
  return katex.renderToString(tex, { displayMode: display, throwOnError: true, output: "htmlAndMathml" });
}

/** Inline LaTeX, rendered on the server with KaTeX. */
export function Tex({ children }: { children: string }) {
  return <span className="whitespace-nowrap" dangerouslySetInnerHTML={{ __html: render(children, false) }} />;
}

/** Display LaTeX in a quiet box; long equations scroll sideways on small screens. */
export function TexBlock({ children, className }: { children: string; className?: string }) {
  return (
    <div
      className={cn(
        "overflow-x-auto overflow-y-hidden rounded-xl border border-line bg-surface-2 px-4 py-1 text-ink",
        className,
      )}
      dangerouslySetInnerHTML={{ __html: render(children, true) }}
    />
  );
}
