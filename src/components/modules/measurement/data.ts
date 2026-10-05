export type Level = "nominal" | "ordinal" | "scale";

export interface VariableItem {
  id: string;
  name: string;
  values: string;
  level: Level;
  ordered: boolean;
  distance: boolean;
  why: string;
  /** Answers that are defensible with a caveat. */
  partial?: Partial<Record<Level, string>>;
  /** Explains the specific mistake for a wrong pick. */
  wrong?: Partial<Record<Level, string>>;
}

export const LEVEL_LABEL: Record<Level, string> = {
  nominal: "Nominal",
  ordinal: "Ordinal",
  scale: "Continuous / Scale",
};

export const VARIABLES: VariableItem[] = [
  {
    id: "gender",
    name: "Gender",
    values: "man · woman · other",
    level: "nominal",
    ordered: false,
    distance: false,
    why: "The categories only name different groups. No category is ‘more’ than another, so there is no order and no distance.",
    wrong: {
      ordinal: "There is no natural ranking of the categories; the codes 1, 2, 3 are arbitrary labels.",
      scale: "Coding gender as 1/2 does not make it numeric: the average of the codes has no meaning.",
    },
  },
  {
    id: "age-years",
    name: "Age in years",
    values: "18, 19, 20 … 94",
    level: "scale",
    ordered: true,
    distance: true,
    why: "Values are ordered and a one-year difference means the same everywhere on the scale. Means and standard deviations are meaningful.",
    wrong: {
      ordinal: "There is an order, but you missed that distances are also meaningful: 30 → 40 is the same 10 years as 60 → 70.",
      nominal: "Ages are not just labels: 40 is more than 30.",
    },
  },
  {
    id: "age-groups",
    name: "Age groups",
    values: "18–29 · 30–44 · 45–59 · 60+",
    level: "ordinal",
    ordered: true,
    distance: false,
    why: "The groups can be ranked from youngest to oldest, but they are categories of unequal width, so the ‘distance’ between groups is not a fixed number of years.",
    wrong: {
      nominal: "The groups have a clear order from younger to older.",
      scale: "Grouping turned a scale variable into ordered categories. The codes 1–4 do not represent equal distances (the last group is open-ended).",
    },
  },
  {
    id: "pol-interest",
    name: "Political interest",
    values: "1 not at all … 4 very interested",
    level: "ordinal",
    ordered: true,
    distance: false,
    why: "Four labelled, ordered answers. The numbers 1–4 only encode the order; we cannot assume equal distances between the labels.",
    wrong: {
      nominal: "‘Very interested’ means more interest than ‘fairly interested’: there is an order.",
      scale: "With four verbal labels, the codes are not quantities. ‘Fairly’ minus ‘not very’ is not a measurable distance.",
    },
  },
  {
    id: "happiness",
    name: "Happiness",
    values: "0 extremely unhappy … 10 extremely happy",
    level: "scale",
    ordered: true,
    distance: true,
    why: "Strictly, an 11-point rating is ordinal. In social-science practice, 0–10 scales are usually treated as (quasi-)continuous, which is why we can compare mean happiness with a t-test.",
    partial: {
      ordinal:
        "Defensible: a rating scale is strictly ordinal. In this course, as in most survey research, 0–10 scales are conventionally treated as scale variables so means can be compared.",
    },
    wrong: { nominal: "The scale runs from unhappy to happy: there is a clear order." },
  },
  {
    id: "children",
    name: "Number of children",
    values: "0, 1, 2, 3 …",
    level: "scale",
    ordered: true,
    distance: true,
    why: "A count: ordered, equal differences mean the same thing (one child), and 0 means none.",
    wrong: {
      ordinal: "There is an order, and the distances are also meaningful: 1 → 2 is the same one child as 3 → 4.",
      nominal: "The values are quantities, not labels.",
    },
  },
  {
    id: "religion",
    name: "Religion",
    values: "Catholic · Protestant · Jewish · Muslim · none · other",
    level: "nominal",
    ordered: false,
    distance: false,
    why: "Denominations are different categories with no inherent order.",
    wrong: {
      ordinal: "Denominations cannot be ranked from ‘less’ to ‘more’ on a single dimension.",
      scale: "The codes are arbitrary labels; their mean is meaningless.",
    },
  },
  {
    id: "hours",
    name: "Working hours per week",
    values: "0 … 80",
    level: "scale",
    ordered: true,
    distance: true,
    why: "Hours are a quantity: ordered, equal distances, meaningful zero.",
    wrong: {
      ordinal: "Distances are meaningful here: 30 → 40 hours is the same 10 hours as 40 → 50.",
      nominal: "The values are quantities, not category names.",
    },
  },
  {
    id: "trust",
    name: "Trust in parliament",
    values: "0 no trust at all … 10 complete trust",
    level: "scale",
    ordered: true,
    distance: true,
    why: "Like happiness: strictly ordinal, but 0–10 rating scales are conventionally treated as scale variables in survey research (means, Pearson's r).",
    partial: {
      ordinal:
        "Defensible: a rating scale is strictly ordinal. By course convention, 0–10 scales are treated as scale variables. If in doubt, Spearman's rank correlation is a safe alternative.",
    },
    wrong: { nominal: "The scale runs from no trust to complete trust: there is an order." },
  },
  {
    id: "cigs",
    name: "Cigarettes smoked per day",
    values: "0, 1, 2 … 40",
    level: "scale",
    ordered: true,
    distance: true,
    why: "A count with a meaningful zero and equal distances.",
    wrong: {
      ordinal: "Distances are meaningful: 5 → 10 cigarettes is the same 5 cigarettes as 20 → 25.",
      nominal: "The values are quantities.",
    },
  },
  {
    id: "settlement",
    name: "Type of settlement",
    values: "capital · county seat · town · village",
    level: "nominal",
    ordered: false,
    distance: false,
    why: "As a ‘type’, each category names a kind of place. In most analyses it is handled as nominal.",
    partial: {
      ordinal:
        "Defensible if the categories are explicitly ordered by size or urbanisation (village < town < county seat < capital). Distances between categories are still not meaningful.",
    },
    wrong: { scale: "The codes are category labels; there is no numerical distance between ‘town’ and ‘village’." },
  },
];

export const ROLE_EXERCISE = {
  variable: "Education (highest completed level, 5 categories)",
  level: "Ordinal",
  items: [
    {
      id: "e1",
      rq: "Is education associated with trust in parliament?",
      answer: "X" as const,
      why: "We compare trust (Y) across education groups, so education is the independent variable.",
    },
    {
      id: "e2",
      rq: "Do men and women differ in their highest level of education?",
      answer: "Y" as const,
      why: "Gender defines the groups we compare (X). Education is the outcome being compared, so it is Y.",
    },
    {
      id: "e3",
      rq: "Does the association between age and political participation hold after controlling for education?",
      answer: "Z" as const,
      why: "The X–Y relationship is age → participation. Education is held constant: it is the control variable.",
    },
    {
      id: "e4",
      rq: "Is parents' education related to the respondent's own education?",
      answer: "Y" as const,
      why: "Parents' education comes first and defines the groups (X). The respondent's education is the outcome (Y).",
    },
  ],
};
