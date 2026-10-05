export interface ModuleMeta {
  slug: string;
  href: string;
  number: string;
  title: string;
  short: string;
  blurb: string;
  /** Which links of the analysis chain this module trains (indices into CHAIN). */
  chain: number[];
}

export const CHAIN = [
  "Research question",
  "Variables",
  "Variable roles",
  "Measurement levels",
  "Method choice",
  "Statistical logic",
  "SPSS workflow",
  "Output interpretation",
  "Defensible conclusion",
] as const;

export const MODULES: ModuleMeta[] = [
  {
    slug: "measurement",
    href: "/measurement",
    number: "01",
    title: "Measurement Levels",
    short: "Levels",
    blurb: "Nominal, ordinal, scale and why a variable's level is not the same as its role.",
    chain: [1, 2, 3],
  },
  {
    slug: "crosstabs",
    href: "/crosstabs",
    number: "02",
    title: "Crosstabs",
    short: "Crosstabs",
    blurb: "Denominators, row vs column percentages, expected counts, χ² and Cramer's V.",
    chain: [4, 5, 6, 7],
  },
  {
    slug: "lazarsfeld",
    href: "/lazarsfeld",
    number: "03",
    title: "Lazarsfeld Paradigm",
    short: "Lazarsfeld",
    blurb: "What happens to X → Y when you control for Z: replication, specification, explanation, interpretation.",
    chain: [2, 5, 7, 8],
  },
  {
    slug: "p-values",
    href: "/p-values",
    number: "04",
    title: "p-values",
    short: "p-values",
    blurb: "The null distribution, tail areas, sample size, and why significant does not mean important.",
    chain: [5, 7, 8],
  },
  {
    slug: "correlation",
    href: "/correlation",
    number: "05",
    title: "Correlation",
    short: "Correlation",
    blurb: "Direction and strength of linear association, Pearson vs Spearman, and what r cannot tell you.",
    chain: [3, 4, 5, 6, 7],
  },
  {
    slug: "t-tests",
    href: "/t-tests",
    number: "06",
    title: "t-tests",
    short: "t-tests",
    blurb: "One-sample, independent-samples and paired-samples: choose the comparison, read the output.",
    chain: [4, 5, 6, 7],
  },
];

export const REVIEW_TOPICS = [
  { id: "levels", label: "Measurement levels", href: "/measurement#understand" },
  { id: "xyz", label: "X / Y / Z", href: "/measurement#roles" },
  { id: "percent", label: "Row vs column percentages", href: "/crosstabs#understand" },
  { id: "p", label: "p-value", href: "/p-values#understand" },
  { id: "chi", label: "χ² vs Cramer's V", href: "/crosstabs#chi" },
  { id: "lazarsfeld", label: "Lazarsfeld paradigm", href: "/lazarsfeld#understand" },
  { id: "pearson", label: "Pearson vs Spearman", href: "/correlation#choose" },
  { id: "ttest", label: "t-test selection", href: "/t-tests#understand" },
] as const;
