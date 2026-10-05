import { gaussian, mean, mulberry32 } from "@/lib/stats";

function sample(seed: number, n: number, mu: number, sd: number) {
  const g = gaussian(mulberry32(seed));
  return Array.from({ length: n }, () => mu + sd * g());
}

const W = 420;
const sx = (v: number, lo = 40, hi = 80) => Math.round((20 + ((v - lo) / (hi - lo)) * (W - 40)) * 10) / 10;

function Axis({ y, lo = 40, hi = 80 }: { y: number; lo?: number; hi?: number }) {
  const ticks = [];
  for (let t = lo; t <= hi; t += 10) ticks.push(t);
  return (
    <g>
      <line x1={20} x2={W - 20} y1={y} y2={y} className="stroke-line-strong" />
      {ticks.map((t) => (
        <text key={t} x={sx(t, lo, hi)} y={y + 14} textAnchor="middle" className="fill-faint font-mono text-[11px]">
          {t}
        </text>
      ))}
    </g>
  );
}

export function OneSampleDiagram() {
  const xs = sample(3, 28, 64, 6);
  const m = mean(xs);
  return (
    <svg viewBox={`0 0 ${W} 120`} className="w-full" role="img" aria-label="One-sample t-test: sample mean compared with the test value 60">
      {xs.map((v, i) => (
        <circle key={i} cx={sx(v)} cy={52 + ((i * 7) % 22) - 11} r={3.5} className="fill-rx" opacity={0.5} />
      ))}
      <line x1={sx(60)} x2={sx(60)} y1={20} y2={88} className="stroke-faint" strokeDasharray="4 4" strokeWidth={1.5} />
      <text x={sx(60)} y={14} dx={-5} textAnchor="end" className="fill-muted text-[12px] font-medium">test value 60</text>
      <line x1={sx(m)} x2={sx(m)} y1={24} y2={88} className="stroke-rx" strokeWidth={2.5} />
      <text x={sx(m)} y={14} textAnchor="start" dx={5} className="fill-rx text-[12px] font-semibold">x̄ = {m.toFixed(1)}</text>
      <path d={`M${sx(60) + 3},80 L${sx(m) - 3},80`} className="stroke-accent" strokeWidth={1.5} markerEnd="url(#ah)" />
      <defs>
        <marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M0 0L10 5L0 10z" className="fill-accent" />
        </marker>
      </defs>
      <Axis y={96} />
    </svg>
  );
}

export function IndependentDiagram() {
  const a = sample(11, 22, 55, 6);
  const b = sample(12, 22, 63, 6);
  const ma = mean(a);
  const mb = mean(b);
  return (
    <svg viewBox={`0 0 ${W} 150`} className="w-full" role="img" aria-label="Independent-samples t-test: two separate groups' means compared">
      <text x={20} y={22} className="fill-rx text-[12px] font-semibold">Group A</text>
      <text x={20} y={78} className="fill-ry text-[12px] font-semibold">Group B</text>
      {a.map((v, i) => (
        <circle key={`a${i}`} cx={sx(v)} cy={38 + ((i * 5) % 12) - 6} r={3.3} className="fill-rx" opacity={0.5} />
      ))}
      {b.map((v, i) => (
        <circle key={`b${i}`} cx={sx(v)} cy={94 + ((i * 5) % 12) - 6} r={3.3} className="fill-ry" opacity={0.5} />
      ))}
      <line x1={sx(ma)} x2={sx(ma)} y1={26} y2={50} className="stroke-rx" strokeWidth={2.5} />
      <line x1={sx(mb)} x2={sx(mb)} y1={82} y2={106} className="stroke-ry" strokeWidth={2.5} />
      <path d={`M${sx(ma)},54 L${sx(mb)},78`} className="stroke-accent" strokeWidth={1.5} strokeDasharray="3 3" />
      <text x={(sx(ma) + sx(mb)) / 2 + 8} y={68} className="fill-accent text-[12px] font-medium">mean difference</text>
      <Axis y={124} />
    </svg>
  );
}

export function PairedDiagram() {
  const people = [
    { b: 52, a: 58 },
    { b: 64, a: 67 },
    { b: 47, a: 55 },
    { b: 70, a: 72 },
  ];
  return (
    <svg viewBox={`0 0 ${W} 150`} className="w-full" role="img" aria-label="Paired-samples t-test: two measurements from the same people; the test uses each person's difference">
      {people.map((p, i) => {
        const y = 20 + i * 25;
        return (
          <g key={i}>
            <text x={2} y={y + 4} className="fill-muted text-[12px]">P{i + 1}</text>
            <line x1={sx(p.b)} x2={sx(p.a)} y1={y} y2={y} className="stroke-faint" strokeWidth={1.5} />
            <circle cx={sx(p.b)} cy={y} r={4.5} className="fill-surface stroke-rz" strokeWidth={1.8} />
            <circle cx={sx(p.a)} cy={y} r={4.5} className="fill-rz" />
            <text x={sx(p.a) + 8} y={y + 4} className="fill-rz font-mono text-[12px]">+{p.a - p.b}</text>
          </g>
        );
      })}
      <g className="text-[12px]">
        <circle cx={W - 120} cy={118} r={4} className="fill-surface stroke-rz" strokeWidth={1.6} />
        <text x={W - 112} y={121} className="fill-muted">before</text>
        <circle cx={W - 64} cy={118} r={4} className="fill-rz" />
        <text x={W - 56} y={121} className="fill-muted">after</text>
      </g>
      <Axis y={132} />
    </svg>
  );
}
