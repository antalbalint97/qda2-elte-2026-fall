export type ConceptId =
  | "measurement"
  | "roles"
  | "crosstab-percent"
  | "chi-square"
  | "p-value"
  | "lazarsfeld-pattern"
  | "lazarsfeld-control"
  | "lazarsfeld-sequence"
  | "correlation"
  | "pearson-spearman"
  | "t-test-choice"
  | "t-test-output"
  | "effect-size";

export interface ConceptMeta {
  label: string;
  href: string;
  definition: string;
}

export const CONCEPTS: Record<ConceptId, ConceptMeta> = {
  measurement: {
    label: "Measurement levels",
    href: "/measurement#understand",
    definition:
      "Measurement level describes what the values of a variable mean: nominal = categories without order; ordinal = ordered categories without equal distances; scale (continuous) = numbers where distances are meaningful.",
  },
  roles: {
    label: "Variable roles (X / Y / Z)",
    href: "/measurement#roles",
    definition:
      "A variable's role is set by the research question: the independent variable X is the one we compare across, the dependent variable Y is the outcome we compare, and the control variable Z is held constant to see how the X–Y relationship changes.",
  },
  "crosstab-percent": {
    label: "Row vs column percentages",
    href: "/crosstabs#understand",
    definition:
      "Percentages are computed within the categories of the independent variable X, so that the distribution of Y can be compared across X groups. Whether that is row % or column % depends only on where X is placed in the table.",
  },
  "chi-square": {
    label: "χ² vs Cramer's V",
    href: "/crosstabs#chi",
    definition:
      "The chi-square test asks whether there is evidence of an association in the population (statistical significance). Cramer's V describes how strong the association is (0 = none, 1 = perfect).",
  },
  "p-value": {
    label: "p-value logic",
    href: "/p-values#understand",
    definition:
      "The p-value is the probability of obtaining a result at least as extreme as the observed one if the null hypothesis were true. It is not the probability that H0 is true and it is not an effect size.",
  },
  "lazarsfeld-pattern": {
    label: "Lazarsfeld patterns",
    href: "/lazarsfeld#understand",
    definition:
      "Replication: the X–Y relationship stays the same in the partial tables. Specification: it differs between categories of Z. Explanation: it weakens or disappears and Z is antecedent (Z → X → Y). Interpretation: it weakens or disappears and Z is intervening (X → Z → Y).",
  },
  "lazarsfeld-control": {
    label: "Antecedent vs intervening",
    href: "/lazarsfeld#understand",
    definition:
      "An antecedent control variable comes before X in the causal/temporal sequence (Z → X → Y). An intervening control variable lies between X and Y (X → Z → Y).",
  },
  "lazarsfeld-sequence": {
    label: "Lazarsfeld analysis sequence",
    href: "/lazarsfeld#sequence",
    definition:
      "Model → hypotheses and type of control variable → two-dimensional (zero-order) table → three-dimensional table (partial tables compared with the zero-order relationship) → classification of the pattern.",
  },
  correlation: {
    label: "Interpreting r",
    href: "/correlation#understand",
    definition:
      "Pearson's r ranges from −1 to +1 and describes the direction and strength of a linear association. It is not a slope, does not imply causation, and r ≈ 0 does not rule out a nonlinear relationship.",
  },
  "pearson-spearman": {
    label: "Pearson vs Spearman",
    href: "/correlation#choose",
    definition:
      "Use Pearson for two scale variables with a roughly linear relationship. Use Spearman (a rank-based measure of monotonic association) for ordinal variables or when Pearson's assumptions are not appropriate.",
  },
  "t-test-choice": {
    label: "Choosing a t-test",
    href: "/t-tests#understand",
    definition:
      "One-sample: one mean vs a fixed value. Independent-samples: means of two separate groups. Paired-samples: two measurements from the same respondents (or matched pairs).",
  },
  "t-test-output": {
    label: "Reading t-test output",
    href: "/t-tests#spss",
    definition:
      "Read the mean difference, the t statistic, df and Sig. (2-tailed). For independent samples, Levene's test decides which row to read: p ≥ .05 → equal variances assumed; p < .05 → not assumed.",
  },
  "effect-size": {
    label: "Significance vs effect size",
    href: "/p-values#n",
    definition:
      "Statistical significance depends on both effect size and sample size. A tiny effect can be significant in a huge sample; effect size measures (Cramer's V, r, Cohen's d) describe magnitude.",
  },
};
