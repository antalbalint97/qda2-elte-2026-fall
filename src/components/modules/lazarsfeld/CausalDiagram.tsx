import type { Pattern } from "./data";

/**
 * Relationship diagram for a Lazarsfeld pattern. Positions encode the causal/temporal
 * sequence; a faded X→Y arrow means the zero-order relationship weakens after control.
 */
export function CausalDiagram({
  pattern,
  x,
  y,
  z,
  className,
}: {
  pattern: Pattern | "zero" | "control";
  x: string;
  y: string;
  z: string;
  className?: string;
}) {
  const W = 380;
  const H = 170;
  const X = { x: 68, y: 125 };
  const Y = { x: 312, y: 125 };
  const Zpos =
    pattern === "interp" ? { x: 190, y: 40 } : pattern === "expl" ? { x: 68, y: 35 } : { x: 190, y: 35 };
  const xyFaded = pattern === "expl" || pattern === "interp";
  const showZ = pattern !== "zero";

  const cls = {
    X: { box: "fill-rx-soft stroke-rx", text: "fill-rx" },
    Y: { box: "fill-ry-soft stroke-ry", text: "fill-ry" },
    Z: { box: "fill-rz-soft stroke-rz", text: "fill-rz" },
  };
  const node = (p: { x: number; y: number }, role: "X" | "Y" | "Z", label: string) => (
    <g style={{ transform: `translate(${p.x}px, ${p.y}px)`, transition: "transform 600ms cubic-bezier(.2,.7,.2,1)" }}>
      <rect x={-62} y={-19} width={124} height={38} rx={10} className={cls[role].box} strokeWidth={1.6} />
      <text y={-4} textAnchor="middle" className={`${cls[role].text} font-mono text-[10px] font-bold`}>
        {role}
      </text>
      <text y={10} textAnchor="middle" className="fill-ink text-[10.5px] font-medium">
        {label.length > 22 ? label.slice(0, 21) + "…" : label}
      </text>
    </g>
  );

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={className} role="img" aria-label={`Diagram: ${describe(pattern, x, y, z)}`}>
      <defs>
        <marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 0L10 5L0 10z" className="fill-muted" />
        </marker>
        <marker id="arr-z" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 0L10 5L0 10z" className="fill-rz" />
        </marker>
      </defs>
      {/* X → Y */}
      <line
        x1={X.x + 64}
        y1={X.y}
        x2={Y.x - 66}
        y2={Y.y}
        className="stroke-muted"
        strokeWidth={2}
        markerEnd="url(#arr)"
        style={{ opacity: xyFaded ? 0.22 : 1, transition: "opacity 500ms" }}
        strokeDasharray={xyFaded ? "4 4" : undefined}
      />
      {xyFaded && (
        <text x={190} y={163} textAnchor="middle" className="fill-faint text-[10px]">
          weakens / disappears after control
        </text>
      )}
      {showZ && (pattern === "rep" || pattern === "control") && (
        <line x1={190} y1={56} x2={190} y2={110} className="stroke-rz" strokeWidth={1.4} strokeDasharray="3 4" opacity={0.6} />
      )}
      {showZ && (pattern === "rep" || pattern === "control") && (
        <text x={200} y={90} className="fill-faint text-[10px]">
          {pattern === "rep" ? "held constant, no change" : "held constant"}
        </text>
      )}
      {showZ && pattern === "spec" && (
        <>
          <line x1={190} y1={56} x2={190} y2={119} className="stroke-rz" strokeWidth={1.8} markerEnd="url(#arr-z)" />
          <text x={190} y={90} className="fill-rz text-[10px]">strength depends on Z</text>
        </>
      )}
      {showZ && pattern === "expl" && (
        <>
          <line x1={68} y1={56} x2={68} y2={103} className="stroke-rz" strokeWidth={1.8} markerEnd="url(#arr-z)" />
          <path d="M132 40 Q 270 45 306 103" fill="none" className="stroke-rz" strokeWidth={1.8} markerEnd="url(#arr-z)" />
        </>
      )}
      {showZ && pattern === "interp" && (
        <>
          <line x1={95} y1={105} x2={150} y2={60} className="stroke-rz" strokeWidth={1.8} markerEnd="url(#arr-z)" />
          <line x1={230} y1={60} x2={285} y2={105} className="stroke-rz" strokeWidth={1.8} markerEnd="url(#arr-z)" />
        </>
      )}
      {node(X, "X", x)}
      {node(Y, "Y", y)}
      <g style={{ opacity: showZ ? 1 : 0, transition: "opacity 400ms" }}>{node(Zpos, "Z", z)}</g>
    </svg>
  );
}

function describe(p: Pattern | "zero" | "control", x: string, y: string, z: string) {
  switch (p) {
    case "zero":
      return `${x} is associated with ${y}`;
    case "control":
      return `${z} is held constant`;
    case "rep":
      return `${z} is held constant and the ${x}–${y} relationship stays the same`;
    case "spec":
      return `the strength of the ${x}–${y} relationship depends on ${z}`;
    case "expl":
      return `${z} comes before ${x} and is related to both ${x} and ${y}; the ${x}–${y} relationship weakens`;
    case "interp":
      return `${x} relates to ${z}, which relates to ${y}; the direct ${x}–${y} relationship weakens`;
  }
}
