// Small schematic thumbnail per laboratory (portfolio cards). Decorative: each one draws the lab's signature
// object in the shared visual grammar (coral squares, teal model lines, blue data points), not live data.
type R = { x: number; y: number; w: number; h: number; rx: number; fill: string; op: number; stroke?: string };

const T = "var(--model)", D = "var(--data)", Rs = "var(--residual)", V = "var(--explained)", K = "var(--ink)";
const RI = "var(--residual-ink)", A = "var(--attention)", G = "var(--border-strong)", L = "var(--border)";
const sq = (x: number, y: number, s: number, f: string): R => ({ x, y, w: s, h: s, rx: 1, fill: f, op: 0.35, stroke: f });
const bar = (x: number, y: number, w: number, h: number, f: string, op = 0.8): R => ({ x, y, w, h, rx: 2, fill: f, op });
const dot = (x: number, y: number, f: string, op = 1, stroke?: string): R => ({ x, y, w: 5, h: 5, rx: 3, fill: f, op, stroke });
const range = (n: number) => Array.from({ length: n }, (_, i) => i);

const G_: Record<string, R[]> = {
  "vra-lab": [bar(20, 40, 220, 1.5, K, 1), sq(40, 26, 14, Rs), sq(80, 18, 22, Rs), sq(130, 34, 6, Rs), sq(170, 12, 28, Rs), sq(220, 30, 10, Rs)],
  "sampling-universe": (() => {
    const h = [3, 6, 10, 16, 22, 26, 24, 18, 12, 8, 5, 3];
    return [...h.map((v, i) => bar(20 + i * 18, 48 - v, 10, v, Rs)), bar(20, 56, 220, 1, K, 0.6), bar(120, 10, 1.5, 48, K, 1)];
  })(),
  "ci-explorer": [...range(7).map((i) => bar(60 + (i % 3) * 14 - i * 7, 10 + i * 8, 110 - (i % 4) * 12, 2.5, i === 4 ? RI : T, 1)), bar(130, 6, 1.5, 60, K, 1)],
  "ttest-lab": [bar(40, 35, 60, 1.5, K, 1), bar(160, 22, 60, 1.5, K, 1), ...range(6).map((i) => dot(46 + i * 9, 28 + (i % 3) * 6, D)), ...range(6).map((i) => dot(166 + i * 9, 14 + (i % 3) * 6, T)), bar(130, 22, 2, 13, RI, 1)],
  "survey-weighting-studio": [
    ...range(30).map((i) => {
      const on = [2, 5, 13, 17, 24, 28].includes(i);
      return { x: 14 + (i % 10) * 20, y: 12 + Math.floor(i / 10) * 16, w: 7, h: 7, rx: 4, fill: i % 7 === 0 ? V : i % 3 === 0 ? T : D, op: on ? 1 : 0.35, stroke: on ? K : undefined };
    }),
    bar(215, 8, 1.5, 54, A, 1),
  ],
  "hypothesis-lab": (() => {
    const h = [1, 2, 4, 8, 14, 20, 24, 24, 20, 14, 8, 4, 2, 1];
    return [...h.map((v, i) => bar(20 + i * 16, 55 - v, 12, v, i > 10 ? Rs : G)), bar(196, 10, 1.5, 46, RI, 1)];
  })(),
  "anova-studio": [bar(20, 38, 220, 1.5, K, 1), bar(40, 24, 50, 1.5, D, 1), bar(105, 44, 50, 1.5, T, 1), bar(170, 30, 50, 1.5, V, 1), sq(60, 24, 14, D), sq(125, 38, 6, T), sq(190, 30, 8, V)],
  "categorical-lab": [bar(20, 10, 90, 22, D, 0.7), bar(112, 10, 128, 22, T, 0.7), bar(20, 34, 60, 24, D, 0.4), bar(82, 34, 158, 24, T, 0.4)],
  "lazarsfeld-simpson-lab": [bar(30, 20, 30, 40, D, 0.8), bar(64, 32, 30, 28, D, 0.5), bar(130, 36, 30, 24, T, 0.8), bar(164, 16, 30, 44, T, 0.5), bar(110, 8, 1, 56, K, 0.4)],
  "corr-reg-lab": [bar(20, 58, 220, 1, K, 0.5), { x: 20, y: 50, w: 220, h: 1.5, rx: 0, fill: T, op: 1 }, ...range(9).map((i) => dot(30 + i * 24, 48 - i * 4 + (i % 2 ? 6 : -5), D)), sq(78, 36, 8, Rs), sq(126, 24, 10, Rs)],
  "distribution-studio": (() => {
    const h = [2, 4, 7, 11, 16, 22, 28, 32, 32, 28, 22, 16, 11, 7, 4, 2];
    return h.map((v, i) => bar(16 + i * 14, 56 - v, 11, v, i >= 9 && i <= 11 ? V : G, 1));
  })(),
  "probability-playground": [bar(30, 10, 110, 50, D, 0.5), bar(140, 10, 90, 50, T, 0.3), bar(30, 10, 110, 22, V, 0.5)],
  "expected-value-lab": [bar(20, 56, 220, 1.5, K, 1), bar(40, 30, 24, 26, D), bar(90, 16, 24, 40, D), bar(140, 40, 24, 16, D), bar(190, 46, 24, 10, D), { x: 104, y: 58, w: 10, h: 8, rx: 1, fill: K, op: 1 }],
  "survey-design-studio": range(20).map((i) => ({ x: 14 + (i % 5) * 46, y: 10 + Math.floor(i / 5) * 13, w: 40, h: 9, rx: 2, fill: [3, 7, 12, 16].includes(i) ? T : L, op: 1 })),
  "weighting-calibration-lab": [bar(20, 56, 220, 1.5, K, 1), ...[10, 30, 42, 36, 24, 14, 8, 4].map((v, i) => bar(30 + i * 26, 56 - v, 18, v, V))],
  "complex-survey-lab": [bar(20, 14, 60, 10, RI, 0.9), bar(20, 30, 110, 10, D, 0.9), bar(20, 46, 120, 10, T, 0.9), bar(150, 10, 1, 52, K, 0.4)],
  "measurement-index-lab": range(6).map((i) => bar(24 + i * 36, 16 + (i === 3 ? 22 : 0), 28, 28 - (i === 3 ? 22 : 0), i === 3 ? RI : T, 0.7)),
  "linalg-pca-studio": [...range(14).map((i) => dot(60 + i * 10 + (i % 3) * 4, 52 - i * 2.6 + (i % 2 ? 8 : -6), D)), { x: 40, y: 36, w: 180, h: 1.5, rx: 0, fill: V, op: 1 }],
  "math-studio": [bar(20, 56, 220, 1, K, 0.5), ...range(12).map((i) => bar(30 + i * 17, 56 - (i - 5.5) ** 2 * 1.4 - 4, 12, (i - 5.5) ** 2 * 1.4 + 4, V, 0.5)), { x: 118, y: 6, w: 6, h: 6, rx: 3, fill: K, op: 1 }],
  "model-diagnostics-studio": [bar(20, 36, 220, 1, K, 0.5), ...range(12).map((i) => dot(28 + i * 18, 36 - (i % 2 ? 1 : -1) * (2 + i * 2.2) - 2.5, Rs))],
};

export function LabGlyph({ id }: { id: string }) {
  const rects = G_[id] ?? [bar(20, 30, 220, 10, L, 1)];
  return (
    <svg viewBox="0 0 260 70" aria-hidden className="block h-auto w-full rounded-lg bg-bg">
      {rects.map((r, i) => (
        <rect key={i} x={r.x} y={r.y} width={r.w} height={r.h} rx={r.rx} fill={r.fill} fillOpacity={r.op} stroke={r.stroke ?? "none"} />
      ))}
    </svg>
  );
}
