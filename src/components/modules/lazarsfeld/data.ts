export type Pattern = "rep" | "spec" | "expl" | "interp";
export type ZType = "ante" | "inter";
export type Change = "same" | "differs" | "weakens";

export const PATTERN_NAME: Record<Pattern, string> = {
  rep: "Replication",
  spec: "Specification",
  expl: "Explanation",
  interp: "Interpretation",
};

export const PATTERN_SUMMARY: Record<Pattern, string> = {
  rep: "Same relationship after control.",
  spec: "Relationship differs by subgroup.",
  expl: "The original relationship is explained by an antecedent variable.",
  interp: "The original relationship operates through an intervening variable.",
};

export const CHANGE_LABEL: Record<Change, string> = {
  same: "They stay approximately the same as the zero-order relationship",
  differs: "They differ substantially between the categories of Z",
  weakens: "They weaken strongly or disappear in every partial table",
};

export interface LzExample {
  pattern: Pattern;
  zType: ZType;
  x: string;
  y: string;
  z: string;
  xCats: [string, string];
  zCats: [string, string];
  yLabel: string;
  zero: [number, number];
  partials: [[number, number], [number, number]];
  note: string;
}

/** One zero-order relationship (education → participation), four different stories after control. */
export const EXPLORER: Record<Pattern, LzExample> = {
  rep: {
    pattern: "rep",
    zType: "ante",
    x: "Education",
    y: "Political participation",
    z: "Gender",
    xCats: ["No degree", "Degree"],
    zCats: ["Women", "Men"],
    yLabel: "% politically active",
    zero: [30, 55],
    partials: [
      [28, 53],
      [32, 57],
    ],
    note: "Among women and among men, graduates are about 25 points more likely to be active. Controlling for gender changes nothing essential.",
  },
  spec: {
    pattern: "spec",
    zType: "ante",
    x: "Education",
    y: "Political participation",
    z: "Settlement type",
    xCats: ["No degree", "Degree"],
    zCats: ["Village", "City"],
    yLabel: "% politically active",
    zero: [30, 55],
    partials: [
      [30, 32],
      [30, 78],
    ],
    note: "The education gap is almost absent in villages (+2) but large in cities (+48). Settlement type specifies where the association appears.",
  },
  expl: {
    pattern: "expl",
    zType: "ante",
    x: "Education",
    y: "Political participation",
    z: "Parents' social status",
    xCats: ["No degree", "Degree"],
    zCats: ["Low status", "High status"],
    yLabel: "% politically active",
    zero: [30, 55],
    partials: [
      [20, 21],
      [60, 61],
    ],
    note: "Within each parental-status group the education gap disappears. Parents' status comes before education and is related to both: the zero-order association is explained by it.",
  },
  interp: {
    pattern: "interp",
    zType: "inter",
    x: "Education",
    y: "Political participation",
    z: "Political interest",
    xCats: ["No degree", "Degree"],
    zCats: ["Low interest", "High interest"],
    yLabel: "% politically active",
    zero: [30, 55],
    partials: [
      [20, 21],
      [60, 61],
    ],
    note: "The partial tables look exactly like the explanation case. The difference is where Z sits: interest lies between education and participation, so the association operates through it.",
  },
};

export interface Scenario {
  id: string;
  title: string;
  story: string;
  x: string;
  y: string;
  z: string;
  xCats: [string, string];
  zCats: [string, string];
  yLabel: string;
  zero: [number, number];
  partials: [[number, number], [number, number]];
  zType: ZType;
  zTypeWhy: string;
  change: Change;
  pattern: Pattern;
  conclusion: string;
}

export const SCENARIOS: Scenario[] = [
  {
    id: "s1",
    title: "Education, participation and gender",
    story:
      "A survey finds that graduates are more likely to have taken part in a political activity (petition, demonstration, contacting a politician) in the past year. The researcher checks whether this holds for both women and men.",
    x: "Education",
    y: "Political participation",
    z: "Gender",
    xCats: ["No degree", "Degree"],
    zCats: ["Women", "Men"],
    yLabel: "% politically active",
    zero: [22, 47],
    partials: [
      [21, 45],
      [23, 49],
    ],
    zType: "ante",
    zTypeWhy: "Gender is fixed before education is completed, so it comes before X.",
    change: "same",
    pattern: "rep",
    conclusion:
      "The association between education and participation is about +25 points among both women and men. It is replicated after controlling for gender.",
  },
  {
    id: "s2",
    title: "Religiosity and volunteering",
    story:
      "Religious respondents are more likely to have done voluntary work in the past year. The researcher controls for the type of settlement where the respondent grew up.",
    x: "Religiosity",
    y: "Volunteering",
    z: "Settlement type (childhood)",
    xCats: ["Not religious", "Religious"],
    zCats: ["Village", "City"],
    yLabel: "% volunteered",
    zero: [18, 34],
    partials: [
      [15, 41],
      [20, 23],
    ],
    zType: "ante",
    zTypeWhy: "Where someone grew up precedes their adult religiosity, so Z comes before X.",
    change: "differs",
    pattern: "spec",
    conclusion:
      "The association is strong among those who grew up in villages (+26) but almost absent among those who grew up in cities (+3). Settlement type specifies the relationship.",
  },
  {
    id: "s3",
    title: "Internet use and income",
    story:
      "Heavy internet users are more likely to have above-median income. The researcher suspects education is related to both and controls for it.",
    x: "Internet use",
    y: "Income",
    z: "Education",
    xCats: ["Light use", "Heavy use"],
    zCats: ["No degree", "Degree"],
    yLabel: "% above median income",
    zero: [31, 62],
    partials: [
      [28, 30],
      [70, 72],
    ],
    zType: "ante",
    zTypeWhy: "Education is typically completed before current internet-use habits and income are measured: Z → X and Z → Y.",
    change: "weakens",
    pattern: "expl",
    conclusion:
      "Within both education groups the internet-use gap shrinks to about 2 points. The zero-order association is largely accounted for by education, an antecedent variable: explanation.",
  },
  {
    id: "s4",
    title: "Education, interest and participation",
    story:
      "Graduates participate more in politics. The researcher proposes that education raises political interest, which in turn is associated with participation.",
    x: "Education",
    y: "Political participation",
    z: "Political interest",
    xCats: ["No degree", "Degree"],
    zCats: ["Low interest", "High interest"],
    yLabel: "% politically active",
    zero: [22, 47],
    partials: [
      [15, 17],
      [52, 55],
    ],
    zType: "inter",
    zTypeWhy: "In the proposed mechanism, interest develops after (and partly through) education and before participation: X → Z → Y.",
    change: "weakens",
    pattern: "interp",
    conclusion:
      "Within levels of political interest the education gap almost disappears. Consistent with the proposed mechanism, the association appears to operate through interest: interpretation.",
  },
  {
    id: "s5",
    title: "Gender, working hours and income",
    story:
      "In a stylised sample, men are more likely than women to earn above the median. The researcher examines whether this is linked to working hours (part-time vs full-time).",
    x: "Gender",
    y: "Income",
    z: "Working hours",
    xCats: ["Women", "Men"],
    zCats: ["Part-time", "Full-time"],
    yLabel: "% above median income",
    zero: [38, 58],
    partials: [
      [20, 23],
      [60, 63],
    ],
    zType: "inter",
    zTypeWhy: "Gender is fixed first; working hours are a later outcome that is in turn related to income: X → Z → Y.",
    change: "weakens",
    pattern: "interp",
    conclusion:
      "Within part-time and within full-time workers the gender gap shrinks to about 3 points. In this example the gap operates largely through working hours: interpretation. (In real data a gap often remains; then the interpretation is partial.)",
  },
  {
    id: "s6",
    title: "Unemployment and life satisfaction",
    story:
      "Unemployed respondents are less often satisfied with their lives. The researcher checks whether the gap is similar for women and men.",
    x: "Employment status",
    y: "Life satisfaction",
    z: "Gender",
    xCats: ["Employed", "Unemployed"],
    zCats: ["Women", "Men"],
    yLabel: "% satisfied with life",
    zero: [71, 49],
    partials: [
      [70, 62],
      [72, 40],
    ],
    zType: "ante",
    zTypeWhy: "Gender precedes employment status.",
    change: "differs",
    pattern: "spec",
    conclusion:
      "The gap is −8 points among women but −32 among men. The association between unemployment and lower satisfaction differs by gender: specification.",
  },
  {
    id: "s7",
    title: "Settlement type and religious attendance",
    story:
      "Village residents attend religious services more often than city residents. Villages also have older populations, so the researcher controls for age.",
    x: "Settlement type",
    y: "Religious attendance",
    z: "Age group",
    xCats: ["City", "Village"],
    zCats: ["Under 50", "50 and over"],
    yLabel: "% attend monthly",
    zero: [20, 38],
    partials: [
      [14, 15],
      [40, 42],
    ],
    zType: "ante",
    zTypeWhy: "Age (birth cohort) is fixed before current place of residence and is related to both.",
    change: "weakens",
    pattern: "expl",
    conclusion:
      "Within age groups the settlement gap nearly disappears (+1, +2). The zero-order association is explained by age: explanation.",
  },
  {
    id: "s8",
    title: "Education and social trust",
    story:
      "Graduates more often say that most people can be trusted. The researcher checks whether the pattern holds in younger and older age groups.",
    x: "Education",
    y: "Social trust",
    z: "Age group",
    xCats: ["No degree", "Degree"],
    zCats: ["Under 50", "50 and over"],
    yLabel: "% say most people can be trusted",
    zero: [25, 45],
    partials: [
      [24, 44],
      [26, 46],
    ],
    zType: "ante",
    zTypeWhy: "Age (birth cohort) precedes educational attainment.",
    change: "same",
    pattern: "rep",
    conclusion: "The association is +20 points in both age groups: replication.",
  },
  {
    id: "s9",
    title: "Parents' education and income",
    story:
      "Respondents whose parents had higher education are more likely to earn above the median. The researcher proposes that this runs through the respondent's own education.",
    x: "Parents' education",
    y: "Income",
    z: "Own education",
    xCats: ["Low", "High"],
    zCats: ["No degree", "Degree"],
    yLabel: "% above median income",
    zero: [35, 63],
    partials: [
      [30, 32],
      [66, 69],
    ],
    zType: "inter",
    zTypeWhy: "Parents' education comes first, the respondent's own education next, and current income last: X → Z → Y.",
    change: "weakens",
    pattern: "interp",
    conclusion:
      "Within own-education groups the gap nearly disappears. The association between parents' education and income appears to operate through the respondent's education: interpretation.",
  },
  {
    id: "s10",
    title: "Newspaper reading and participation",
    story:
      "Daily newspaper readers are more politically active. The researcher controls for education, which may be related to both reading habits and participation.",
    x: "Newspaper reading",
    y: "Political participation",
    z: "Education",
    xCats: ["Not daily", "Daily"],
    zCats: ["No degree", "Degree"],
    yLabel: "% politically active",
    zero: [25, 48],
    partials: [
      [18, 20],
      [50, 53],
    ],
    zType: "ante",
    zTypeWhy: "Education is completed before current media habits and participation: Z → X and Z → Y.",
    change: "weakens",
    pattern: "expl",
    conclusion:
      "Within education groups the reading gap shrinks to 2–3 points: the zero-order association is explained by education.",
  },
];

export function patternWhy(picked: Pattern, correct: Pattern): string {
  if (correct === "interp" && picked === "expl")
    return "You selected explanation, but Z lies between X and Y in the proposed mechanism. This is interpretation.";
  if (correct === "expl" && picked === "interp")
    return "You selected interpretation, but Z comes before X (it is antecedent). When an antecedent variable accounts for the relationship, the pattern is explanation.";
  if (correct === "rep")
    return picked === "spec"
      ? "Specification needs the partial relationships to differ between the categories of Z. Here they are about the same as the zero-order relationship."
      : "Explanation and interpretation require the relationship to weaken strongly or disappear after control. Here it stays about the same.";
  if (correct === "spec")
    return picked === "rep"
      ? "Replication needs the relationship to be similar in every partial table. Here it is strong in one category of Z and weak in the other."
      : "The relationship does not weaken in every partial table; it remains in one subgroup. When it differs by subgroup, the pattern is specification.";
  return picked === "rep"
    ? "Replication would mean the relationship survives control. Here it almost disappears in every partial table."
    : "Specification means the relationship differs between subgroups. Here it weakens in all of them.";
}

export const CHANGE_WHY: Record<Change, Record<Change, string>> = {
  same: {
    same: "",
    differs: "Compare the partial differences with each other: they are close, so they do not differ substantially.",
    weakens: "Compare the partial differences with the zero-order difference: they are about as large, not weaker.",
  },
  differs: {
    same: "The partial differences are clearly unequal: large in one category of Z, small in the other.",
    differs: "",
    weakens: "The relationship weakens in only one partial table. ‘Weakens or disappears’ means it shrinks in all of them.",
  },
  weakens: {
    same: "The partial differences are much smaller than the zero-order difference.",
    differs: "The partial differences are similar to each other, and both are small: the relationship weakens everywhere.",
    weakens: "",
  },
};
