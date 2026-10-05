export const GLOSSARY = {
  zeroOrder: {
    term: "Zero-order relationship",
    def: "The original bivariate X–Y relationship, before any control variable is introduced (the two-dimensional crosstab).",
  },
  partial: {
    term: "Partial relationship",
    def: "The X–Y relationship within one category of the control variable Z. Each partial table holds Z constant.",
  },
  control: {
    term: "Control variable (Z)",
    def: "A third variable held constant by splitting the data into its categories, so we can see whether the X–Y relationship changes.",
  },
  antecedent: {
    term: "Antecedent variable",
    def: "A control variable that comes before X in the causal or temporal sequence: Z → X → Y.",
  },
  intervening: {
    term: "Intervening variable",
    def: "A control variable that lies between X and Y in the proposed mechanism: X → Z → Y.",
  },
  denominator: {
    term: "Denominator",
    def: "The total a percentage is computed from. In a crosstab it should be each category of the independent variable X.",
  },
  expected: {
    term: "Expected count",
    def: "The count we would expect in a cell if X and Y were independent: (row total × column total) / N. χ² compares observed and expected counts.",
  },
  nullHyp: {
    term: "Null hypothesis (H₀)",
    def: "The statement of no effect or no difference that the test assumes in order to compute the p-value, e.g. μ = 60 or 'no association'.",
  },
  alpha: {
    term: "Significance level (α)",
    def: "The threshold chosen in advance, usually .05. If p < α we reject H₀.",
  },
  se: {
    term: "Standard error",
    def: "The typical sampling variability of a statistic (e.g. a sample mean). For a mean: s / √n. It shrinks as N grows.",
  },
  df: {
    term: "Degrees of freedom",
    def: "A parameter of the reference distribution. For a one-sample t-test df = n − 1.",
  },
  monotonic: {
    term: "Monotonic relationship",
    def: "As X increases, Y tends to move in one direction only (always up or always down), though not necessarily along a straight line.",
  },
  levene: {
    term: "Levene's test",
    def: "Tests whether the variances of two groups can be treated as equal. It decides which row of the independent-samples t-test output to read.",
  },
} as const;

export type GlossaryKey = keyof typeof GLOSSARY;
