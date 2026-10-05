const ROWS = [
  {
    no: "The probability that H₀ is true",
    why: "p is calculated assuming H₀ is true, so it cannot also measure how likely H₀ is.",
  },
  {
    no: "The probability that the result is due to chance",
    why: "p describes how unusual the data would be under H₀, not the probability that chance ‘caused’ them.",
  },
  {
    no: "A measure of effect size",
    why: "A tiny effect can give a tiny p in a huge sample. Use Cramer's V, r or Cohen's d for magnitude.",
  },
  {
    no: "Proof that H₀ is true when p > .05",
    why: "Not rejecting H₀ means the evidence is insufficient, not that there is no effect.",
  },
];

export function Misconceptions() {
  return (
    <div className="overflow-hidden rounded-2xl border border-line">
      <div className="border-b border-line bg-pos-soft px-4 py-3 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-pos">The p-value is</p>
        <p className="mt-1 font-serif text-lg text-ink">
          the probability of a result at least as extreme as the observed one, if the null hypothesis were true.
        </p>
      </div>
      <div className="bg-surface px-4 py-3 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neg">The p-value is not</p>
        <ul className="mt-2 divide-y divide-line">
          {ROWS.map((r) => (
            <li key={r.no} className="grid gap-1 py-2.5 text-sm sm:grid-cols-[16rem_1fr] sm:gap-4">
              <span className="font-medium text-ink line-through decoration-neg/50">{r.no}</span>
              <span className="text-muted">{r.why}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
