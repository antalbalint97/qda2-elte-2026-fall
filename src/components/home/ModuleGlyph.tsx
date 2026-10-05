/** Small explanatory glyphs for the module index. Each one sketches the module's core idea. */
export function ModuleGlyph({ slug }: { slug: string }) {
  const common = { viewBox: "0 0 64 40", className: "h-10 w-16 shrink-0", "aria-hidden": true } as const;
  switch (slug) {
    case "measurement":
      return (
        <svg {...common}>
          <circle cx="10" cy="20" r="5" className="fill-rx/30 stroke-rx" />
          <line x1="22" y1="26" x2="40" y2="26" className="stroke-line-strong" />
          {[24, 29, 38].map((x) => (
            <circle key={x} cx={x} cy="26" r="2.2" className="fill-accent" />
          ))}
          <line x1="46" y1="26" x2="62" y2="26" className="stroke-ink" />
          {[46, 50, 54, 58, 62].map((x) => (
            <line key={x} x1={x} y1="23" x2={x} y2="29" className="stroke-ink" />
          ))}
        </svg>
      );
    case "crosstabs":
      return (
        <svg {...common}>
          {[0, 1, 2].map((r) =>
            [0, 1, 2].map((c) => (
              <rect key={`${r}${c}`} x={14 + c * 13} y={4 + r * 11} width="12" height="10" rx="1.5" className={r === 1 ? "fill-rx/40" : "fill-surface-3"} />
            )),
          )}
        </svg>
      );
    case "lazarsfeld":
      return (
        <svg {...common}>
          <circle cx="12" cy="30" r="5" className="fill-rx/30 stroke-rx" />
          <circle cx="52" cy="30" r="5" className="fill-ry/30 stroke-ry" />
          <circle cx="32" cy="9" r="5" className="fill-rz/30 stroke-rz" />
          <path d="M17 30h30M15 26l13-13M36 13l13 13" className="stroke-muted" fill="none" />
        </svg>
      );
    case "p-values":
      return (
        <svg {...common}>
          <path d="M2 36 C 18 36, 22 6, 32 6 S 46 36, 62 36" fill="none" className="stroke-ink" />
          <path d="M48 30 C 52 34, 56 36, 62 36 L 62 36 L 48 36Z" className="fill-accent/50" />
          <line x1="48" y1="10" x2="48" y2="36" className="stroke-accent" />
        </svg>
      );
    case "correlation":
      return (
        <svg {...common}>
          {[
            [8, 32], [14, 28], [19, 30], [24, 22], [30, 23], [35, 17], [40, 19], [46, 12], [51, 13], [56, 7],
          ].map(([x, y]) => (
            <circle key={x} cx={x} cy={y} r="2" className="fill-rx" />
          ))}
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <path d="M4 34 C 14 34, 16 10, 22 10 S 30 34, 40 34" fill="none" className="stroke-rx" />
          <path d="M24 34 C 34 34, 36 10, 42 10 S 50 34, 60 34" fill="none" className="stroke-ry" />
          <line x1="22" y1="6" x2="42" y2="6" className="stroke-muted" />
        </svg>
      );
  }
}
