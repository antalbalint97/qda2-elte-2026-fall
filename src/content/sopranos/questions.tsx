import { MiniTable } from "@/components/learning/MiniTable";
import type { ChoiceQuestion, OrderQuestion } from "@/content/quiz-types";
import { formatP, noLeadingZero } from "@/lib/stats";
import {
  BENCHMARK,
  EARLY_LATE_BY_FINALE,
  effectLabel,
  N,
  ORDER_VIOLENCE,
  PARTIAL_FINALE,
  PARTIAL_NON_FINALE,
  pct,
  rLabel,
  rowPct,
  RUNTIME_FUCK,
  RUNTIME_VIOLENCE,
  THERAPY_G,
  THERAPY_GROUPS,
  THERAPY_LEVENE,
  THERAPY_ROW,
  ZERO_ORDER,
  ZERO_ORDER_TEST,
} from "./analysis";

/* ---------- Numbers quoted in the questions (all computed from the dataset) ---------- */

const zp = rowPct(ZERO_ORDER);
export const EARLY_PCT = zp[0][1];
export const LATE_PCT = zp[1][1];
export const EARLY_N = ZERO_ORDER[0][0] + ZERO_ORDER[0][1];
export const LATE_N = ZERO_ORDER[1][0] + ZERO_ORDER[1][1];
export const MAJOR_N = ZERO_ORDER[0][1] + ZERO_ORDER[1][1];
/** Share of major-violence episodes that come from later seasons (the tempting, wrong denominator). */
export const LATE_SHARE_OF_MAJOR = (ZERO_ORDER[1][1] / MAJOR_N) * 100;
export const P_TXT = formatP(ZERO_ORDER_TEST.p); // "= .018"
export const P_NUM = P_TXT.replace("= ", ""); // ".018"
export const P_PERCENT = (Number(ZERO_ORDER_TEST.p.toFixed(3)) * 100).toFixed(1) + "%";
export const V_TXT = noLeadingZero(ZERO_ORDER_TEST.cramersV);
const nf = rowPct(PARTIAL_NON_FINALE);
const fi = rowPct(PARTIAL_FINALE);
const r2 = (x: number) => noLeadingZero(x);

const LEVELS = (why: { nominal?: string; ordinal?: string; scale?: string }) => [
  { id: "nominal", label: "Nominal", why: why.nominal },
  { id: "ordinal", label: "Ordinal", why: why.ordinal },
  { id: "scale", label: "Scale / Continuous", why: why.scale },
];

const TTESTS = (why: { one?: string; ind?: string; paired?: string }) => [
  { id: "one", label: "One-sample t-test", why: why.one },
  { id: "ind", label: "Independent-samples t-test", why: why.ind },
  { id: "paired", label: "Paired-samples t-test", why: why.paired },
];

const PATTERNS = (why: { rep?: string; spec?: string; expl?: string; interp?: string }) => [
  { id: "rep", label: "Replication", why: why.rep },
  { id: "spec", label: "Specification", why: why.spec },
  { id: "expl", label: "Explanation", why: why.expl },
  { id: "interp", label: "Interpretation", why: why.interp },
];

const ZPOS = (why: { ante?: string; inter?: string; neither?: string }, withNeither = false) => [
  { id: "ante", label: "Antecedent: Z comes before X (Z → X → Y)", why: why.ante },
  { id: "inter", label: "Intervening: Z lies between X and Y (X → Z → Y)", why: why.inter },
  ...(withNeither ? [{ id: "neither", label: "Neither: Z is not part of the causal sequence", why: why.neither }] : []),
];

/* ================= PART 1: Know your variables ================= */

export const LEVEL_QUESTIONS: ChoiceQuestion[] = [
  {
    kind: "choice",
    id: "sop-lvl-season",
    concept: "measurement",
    format: "Classify variable",
    prompt: "season (1, 2, 3, 4, 5, 6). What is its measurement level?",
    options: LEVELS({
      nominal: "The seasons have a clear order: season 5 comes after season 4. Nominal would throw that order away.",
    }),
    correct: "ordinal",
    partial: {
      scale:
        "Defensible if you treat it as ‘number of seasons elapsed’. But seasons are not equally spaced in time or content, so the course treats season as an ordered category.",
    },
    explanation: "Seasons are ordered categories. The order is meaningful; equal distances between them are not guaranteed (breaks between seasons differ).",
  },
  {
    kind: "choice",
    id: "sop-lvl-rating",
    concept: "measurement",
    format: "Classify variable",
    prompt: "episode_rating: the average audience rating of the episode on a 0–10 scale, e.g. 8.4. What is its measurement level?",
    options: LEVELS({
      nominal: "8.9 is clearly higher than 8.1, so the values are ordered. Nominal ignores that.",
    }),
    correct: "scale",
    partial: {
      ordinal:
        "A single 0–10 answer from one viewer is arguably ordinal. This variable is an average of many ratings, and by course convention 0–10 rating scales are treated as scale.",
    },
    explanation: "An average of many 0–10 ratings is a number where differences are meaningful (8.9 − 8.4 = 0.5 points). Treat it as scale.",
  },
  {
    kind: "choice",
    id: "sop-lvl-death",
    concept: "measurement",
    format: "Classify variable",
    prompt: "death_count: number of deaths in the episode (0, 1, 2, …). What is its measurement level?",
    options: LEVELS({
      nominal: "The numbers are not labels: 3 deaths is more than 1.",
      ordinal: "You saw the order, but missed that the distances are meaningful too: every step is exactly one death.",
    }),
    correct: "scale",
    explanation: "A count has a true zero and equal units. Counts are scale variables.",
  },
  {
    kind: "choice",
    id: "sop-lvl-therapy",
    concept: "measurement",
    format: "Classify variable",
    prompt: "therapy_scene: 0 = no therapy scene, 1 = at least one therapy scene. What is its measurement level?",
    options: LEVELS({
      ordinal: "A yes/no variable has only two categories. Coding them 0 and 1 does not make ‘therapy’ more of anything than ‘no therapy’ in a ranked sense.",
      scale: "The 0/1 codes are labels for two categories, not quantities. You cannot have 0.5 of a therapy scene in this variable.",
    }),
    correct: "nominal",
    explanation: "It is a dichotomous (binary) categorical variable: nominal. Binary variables are often used as grouping variables (X) in crosstabs and t-tests.",
  },
  {
    kind: "choice",
    id: "sop-lvl-tone",
    concept: "measurement",
    format: "Classify variable",
    prompt:
      "episode_tone: 1 = mostly family/personal, 2 = mixed, 3 = mostly organized crime/business. What is its measurement level?",
    options: LEVELS({
      scale: "The codes 1, 2, 3 are labels. ‘Mixed’ is not exactly halfway between family and crime in any measurable unit.",
    }),
    correct: "ordinal",
    partial: {
      nominal:
        "Defensible if you see the three categories as unrelated types. But ‘mixed’ sits between the other two on a family-to-crime dimension, so the categories can be ordered.",
    },
    explanation: "The categories can be ranked by how much of the episode is about the business (1 < 2 < 3), but the distances are not defined. Ordinal.",
  },
  {
    kind: "choice",
    id: "sop-lvl-runtime",
    concept: "measurement",
    format: "Classify variable",
    prompt: "runtime_minutes: length of the episode in minutes. What is its measurement level?",
    options: LEVELS({
      nominal: "Minutes are quantities, not labels.",
      ordinal: "Minutes are ordered and every minute is the same size, so the distances are meaningful.",
    }),
    correct: "scale",
    explanation: "Time in minutes has equal units and a true zero. Scale.",
  },
  {
    kind: "choice",
    id: "sop-lvl-fuck",
    concept: "measurement",
    format: "Classify variable",
    prompt: "fuck_count: number of times the F-word is said in the episode. What is its measurement level?",
    options: LEVELS({
      nominal: "However strongly worded, it is still a number of occurrences, not a category label.",
      ordinal: "It is a count: 40 is exactly 20 more than 20. That is more than an order.",
    }),
    correct: "scale",
    explanation: "Another count, so scale. (Counts are often right-skewed, which matters later when choosing between Pearson and Spearman.)",
  },
];

const PAIR = (why: Record<string, string | undefined>, labels: [string, string, string, string]) => [
  { id: "a", label: labels[0], why: why.a },
  { id: "b", label: labels[1], why: why.b },
  { id: "c", label: labels[2], why: why.c },
  { id: "d", label: labels[3], why: why.d },
];

export const ROLE_QUESTIONS: ChoiceQuestion[] = [
  {
    kind: "choice",
    id: "sop-lvl-role-violence",
    concept: "roles",
    format: "Identify X and Y",
    prompt: "Research question: “Are later seasons more violent than earlier seasons?” Which is X and which is Y?",
    options: PAIR(
      {
        b: "Reversed. The question compares violence across periods of the series, so the period is what we compare across (X) and violence is the outcome (Y).",
        c: "There is no third variable to hold constant in this question. A control variable only appears when we ask whether the relationship changes within categories of something else.",
        d: "Both variables are in the research question, so both play a role.",
      },
      [
        "X = early_late, Y = violence_event_count",
        "X = violence_event_count, Y = early_late",
        "X = early_late, Z = violence_event_count",
        "Neither has a role: it is a descriptive question",
      ],
    ),
    correct: "a",
    explanation: "The groups we compare (early vs late seasons) define X; the variable we compare between them (number of violent events) is Y.",
  },
  {
    kind: "choice",
    id: "sop-lvl-role-therapy-x",
    concept: "roles",
    format: "Identify X and Y",
    prompt: "Research question: “Do episodes with a therapy scene contain fewer violent events?” Which is X and which is Y?",
    options: PAIR(
      {
        a: "Reversed. We are comparing violence between episodes with and without therapy, so therapy_scene defines the groups (X).",
        c: "Measurement level does not decide the role. The research question does.",
        d: "season is not mentioned in this research question.",
      },
      [
        "X = violence_event_count, Y = therapy_scene",
        "X = therapy_scene, Y = violence_event_count",
        "therapy_scene must be Y because it is nominal",
        "X = season, Y = violence_event_count",
      ],
    ),
    correct: "b",
    explanation: "therapy_scene splits the episodes into two groups (X), and the number of violent events is compared between them (Y).",
  },
  {
    kind: "choice",
    id: "sop-lvl-role-therapy-z",
    concept: "roles",
    format: "Identify the role",
    prompt:
      "New research question: “Is episode tone associated with major violence, and does this association hold both in episodes with and without a therapy scene?” What role does therapy_scene play now?",
    options: [
      { id: "X", label: "Independent variable (X)", why: "Here the groups we compare across are the tone categories, so episode_tone is X." },
      { id: "Y", label: "Dependent variable (Y)", why: "The outcome is major_violence." },
      { id: "Z", label: "Control variable (Z)" },
    ],
    correct: "Z",
    explanation:
      "therapy_scene is now held constant: we look at the tone–violence relationship separately within its two categories. The same variable was X in the previous question. Its measurement level (nominal) did not change; only the research question did.",
  },
  {
    kind: "choice",
    id: "sop-lvl-role-rule",
    concept: "roles",
    format: "True or false",
    prompt: "True or false: therapy_scene is nominal, so it can only ever be used as an independent variable.",
    options: [
      { id: "true", label: "True", why: "This mixes up measurement level and role. A nominal variable can be X, Y or Z depending on the research question." },
      { id: "false", label: "False" },
    ],
    correct: "false",
    explanation: "Measurement level ≠ variable role. The level is a property of the variable; the role comes from the research question.",
  },
];

/* ================= PART 2: Frequencies ================= */

export const DESC_QUESTIONS: ChoiceQuestion[] = [
  {
    kind: "choice",
    id: "sop-desc-skew",
    concept: "descriptives",
    format: "Mean or median?",
    prompt:
      "If the distribution of violence counts is strongly right-skewed, would the mean or the median better describe a typical episode?",
    options: [
      { id: "mean", label: "The mean, because it uses every value", why: "Using every value is exactly the problem: a few very violent episodes pull the mean upwards, away from where most episodes are." },
      { id: "median", label: "The median" },
      { id: "sd", label: "The standard deviation", why: "The standard deviation describes spread, not the typical (central) value." },
    ],
    correct: "median",
    explanation:
      "In a right-skewed distribution a few large values drag the mean up, so the mean sits above most episodes. The median (the middle episode) is not affected by how extreme the extreme episodes are. In these data the mean is above the median for exactly this reason.",
  },
  {
    kind: "choice",
    id: "sop-desc-symmetric",
    concept: "descriptives",
    format: "Read the output",
    prompt: "Which of the four variables in the Descriptives output looks closest to symmetric?",
    options: [
      { id: "death", label: "death_count", why: "Most episodes have 0 or 1 deaths and a few have more: a long right tail, and a positive skewness." },
      { id: "fuck", label: "fuck_count", why: "Its mean is well above its median and its maximum is several standard deviations above the mean: strongly right-skewed." },
      { id: "runtime", label: "runtime_minutes" },
      { id: "viol", label: "violence_event_count", why: "Mean above median and positive skewness: right-skewed." },
    ],
    correct: "runtime",
    explanation: "For runtime the mean and median are almost identical and the skewness is close to 0. For the three counts the mean is above the median, the signature of a right tail.",
  },
];

/* ================= PART 3: The Bada Bing crosstab ================= */

export const CROSSTAB_QUESTIONS: ChoiceQuestion[] = [
  {
    kind: "choice",
    id: "sop-ct-iv",
    concept: "roles",
    format: "Question 1",
    prompt: "Research question: “Are later seasons more likely to contain major violence?” What is the independent variable?",
    options: [
      { id: "el", label: "early_late" },
      { id: "mv", label: "major_violence", why: "major_violence is what we want to explain (the outcome), so it is the dependent variable." },
      { id: "season", label: "finale_episode", why: "Finales are not part of this research question (yet)." },
    ],
    correct: "el",
    explanation: "We compare early-season and late-season episodes, so early_late is X.",
  },
  {
    kind: "choice",
    id: "sop-ct-dv",
    concept: "roles",
    format: "Question 2",
    prompt: "And the dependent variable?",
    options: [
      { id: "el", label: "early_late", why: "early_late defines the groups we compare: that is X." },
      { id: "mv", label: "major_violence" },
    ],
    correct: "mv",
    explanation: "Whether the episode contains major violence is the outcome compared across the two periods: Y.",
  },
  {
    kind: "choice",
    id: "sop-ct-compare",
    concept: "crosstab-percent",
    format: "Question 3",
    prompt: "Which percentages should we compare?",
    options: [
      {
        id: "a",
        label: "Of the episodes with major violence, the percentage from later seasons",
        why: "That is a percentage within Y. It tells you where violent episodes come from, not how likely violence is in each period.",
      },
      { id: "b", label: "The percentage of early-season episodes with major violence vs the percentage of late-season episodes with major violence" },
      { id: "c", label: "Each cell as a percentage of all 74 episodes", why: "Total percentages mix up group size with the outcome. They do not compare the distribution of Y across X." },
    ],
    correct: "b",
    explanation: "Percentage within the categories of X (early, late), then compare the share with major violence across them.",
  },
  {
    kind: "choice",
    id: "sop-ct-rowcol",
    concept: "crosstab-percent",
    format: "Question 4",
    prompt: "In the table, early_late is in the rows and major_violence in the columns. Row percentages or column percentages?",
    options: [
      { id: "row", label: "Row percentages" },
      { id: "col", label: "Column percentages", why: "Column percentages would make each major_violence category sum to 100%: percentages within Y, the wrong direction." },
    ],
    correct: "row",
    explanation: "X is in the rows, so row percentages are percentages within X. (If X were in the columns, the answer would be column percentages. The rule is ‘within X’, not ‘always rows’.)",
  },
  {
    kind: "choice",
    id: "sop-ct-h0",
    concept: "chi-square",
    format: "Question 5",
    prompt: "What is H₀ for the chi-square test?",
    options: [
      { id: "a", label: "Later seasons contain more major violence than earlier seasons.", why: "That is the research hypothesis (H₁, with a direction). H₀ is the ‘nothing going on’ hypothesis." },
      { id: "b", label: "Major violence is independent of whether an episode comes from an early or late season." },
      { id: "c", label: "No episode contains major violence.", why: "H₀ is about the relationship between the variables, not about either variable alone." },
    ],
    correct: "b",
    explanation: "H₀: the two variables are independent in the population: the share of episodes with major violence is the same in early and late seasons.",
  },
  {
    kind: "choice",
    id: "sop-ct-chi",
    concept: "chi-square",
    format: "Question 6",
    prompt: "What does the chi-square test tell us?",
    options: [
      { id: "a", label: "How strong the association between season period and major violence is", why: "Strength is Cramer's V. χ² grows with sample size, so it is not a measure of strength." },
      { id: "b", label: "Whether the observed counts differ from the counts expected under independence by more than chance would plausibly produce" },
      { id: "c", label: "Whether later seasons cause major violence", why: "No test on observational data establishes causation by itself." },
    ],
    correct: "b",
    explanation: "χ² compares observed and expected counts. Its p-value tells us how surprising the data would be if the variables were independent.",
  },
  {
    kind: "choice",
    id: "sop-ct-v",
    concept: "chi-square",
    format: "Question 7",
    prompt: `Cramer's V = ${V_TXT}. What does it tell us?`,
    options: [
      { id: "a", label: "The probability that H₀ is true", why: "V is not a probability at all. It is an effect size between 0 and 1." },
      { id: "b", label: "The strength of the association, on a 0 (none) to 1 (perfect) scale" },
      { id: "c", label: "That the association is statistically significant", why: "Significance comes from the χ² test's p-value. V describes strength only." },
    ],
    correct: "b",
    explanation: `V = ${V_TXT}: a weak-to-moderate association. V answers ‘how strong?’, χ² answers ‘is there evidence of any association?’.`,
  },
];

export const qTempting: ChoiceQuestion = {
  kind: "choice",
  id: "sop-ct-tempting",
  concept: "crosstab-percent",
  format: "Tempting interpretation",
  prompt: `A classmate writes: “${LATE_SHARE_OF_MAJOR.toFixed(0)}% of the episodes with major violence occurred in later seasons.” Does this answer whether later seasons are more likely to be violent?`,
  options: [
    {
      id: "yes",
      label: "Yes: most violent episodes are from later seasons, so later seasons are more violent.",
      why: `The denominator is the ${MAJOR_N} violent episodes, so this is a percentage within Y. It depends on how many episodes each period has: with more early-season episodes, early seasons could supply most violent episodes even if they were less likely to be violent.`,
    },
    { id: "no", label: "No: it uses the wrong denominator." },
  ],
  correct: "no",
  explanation: `To ask whether later seasons are more likely to be violent, the denominator must be the episodes in each period: ${pct(EARLY_PCT)} of the ${EARLY_N} early-season episodes vs ${pct(LATE_PCT)} of the ${LATE_N} late-season episodes contain major violence. That comparison answers the question; ‘${LATE_SHARE_OF_MAJOR.toFixed(0)}% of violent episodes’ does not.`,
};

export const qCrosstabMethod: ChoiceQuestion = {
  kind: "choice",
  id: "sop-ct-method",
  concept: "chi-square",
  format: "Choose the method",
  prompt: "Both variables are dichotomous (nominal). Which analysis fits before we touch SPSS?",
  options: [
    { id: "t", label: "Independent-samples t-test", why: "A t-test compares means of a scale Y. major_violence is a 0/1 category." },
    { id: "r", label: "Pearson correlation", why: "Pearson's r needs two scale variables." },
    { id: "ct", label: "Crosstab with percentages within X, χ² test and Cramer's V" },
  ],
  correct: "ct",
  explanation: "Two categorical variables: crosstab, percentages within X, χ² for evidence, Cramer's V for strength.",
};

/* ================= PART 4: The People of New Jersey v. H0 ================= */

export const qTrial: ChoiceQuestion = {
  kind: "choice",
  id: "sop-p-trial",
  concept: "p-value",
  format: "The verdict",
  prompt: `p ${P_TXT}. Which conclusion is correct?`,
  options: [
    {
      id: "a",
      label: `There is a ${P_PERCENT} probability that H₀ is true.`,
      why: "The p-value is calculated assuming H₀ is true, so it cannot also be the probability that H₀ is true. It is P(data this extreme | H₀), not P(H₀ | data).",
    },
    {
      id: "b",
      label: `There is a ${P_PERCENT} probability that the findings happened by chance.`,
      why: "‘Happened by chance’ is a disguised version of A: it is again a probability about H₀ being the explanation. The p-value only says how unusual the data would be if H₀ were true.",
    },
    { id: "c", label: `If H₀ were true, results at least this inconsistent with H₀ would occur with probability about ${P_NUM}.` },
    {
      id: "d",
      label: "The relationship is strong.",
      why: `A small p-value means the evidence against H₀ is convincing, not that the effect is large. With a large sample even a trivial association gives a small p. Strength is Cramer's V (${V_TXT}).`,
    },
  ],
  correct: "c",
  explanation: `The p-value is a conditional probability: assuming independence (H₀), a χ² at least as large as the one observed would occur in about ${P_NUM} × 100 ≈ ${P_PERCENT} of samples. That is below .05, so we reject H₀.`,
};

export const qVerdictStrength: ChoiceQuestion = {
  kind: "choice",
  id: "sop-p-strength",
  concept: "effect-size",
  format: "Sentencing",
  prompt: `p ${P_TXT}, Cramer's V = ${V_TXT}, N = ${N}. Which summary is correct?`,
  options: [
    { id: "a", label: "Significant, therefore strong.", why: "Significance and strength are separate questions. V tells us about strength." },
    { id: "b", label: "Statistically significant evidence of an association that is weak-to-moderate in strength." },
    { id: "c", label: "Not important, because V is below .5.", why: "There is no rule that V below .5 is unimportant. V around .3 is a meaningful association in social-science data." },
  ],
  correct: "b",
  explanation: "p tells us about evidence against H₀. Cramer's V tells us about strength. Report both.",
};

/* ================= PART 5: Lazarsfeld meets Tony Soprano ================= */

export const ZERO_ORDER_SUMMARY = { early: EARLY_PCT, late: LATE_PCT, diff: LATE_PCT - EARLY_PCT };

/** Hypothetical partial tables (percentage of episodes with major violence: [early, late]). */
export const SCENARIOS = {
  A: { z: "Finale episode", zCats: ["Ordinary episodes", "Finales"], partials: [[39, 66], [62, 90]] },
  B: { z: "Finale episode", zCats: ["Ordinary episodes", "Finales"], partials: [[47, 51], [25, 92]] },
  C: { z: "Production budget", zCats: ["Lower budget", "Higher budget"], partials: [[37, 39], [70, 72]] },
  D: { z: "HBO programming policy", zCats: ["Before policy change", "After policy change"], partials: [[36, 38], [71, 73]] },
} as const;

const scenarioTable = (k: keyof typeof SCENARIOS) => {
  const s = SCENARIOS[k];
  return (
    <MiniTable
      caption={`Hypothetical partial tables: % of episodes with major violence, by ${s.z.toLowerCase()}`}
      head={["", "Seasons 1–3", "Seasons 4–6", "Difference"]}
      rows={[
        ["Zero-order (all episodes)", pct(EARLY_PCT), pct(LATE_PCT), `+${(LATE_PCT - EARLY_PCT).toFixed(1)}`],
        ...s.partials.map((p, i) => [s.zCats[i], `${p[0]}%`, `${p[1]}%`, `+${p[1] - p[0]}`]),
      ]}
    />
  );
};

export const qLzA: ChoiceQuestion = {
  kind: "choice",
  id: "sop-lz-a",
  concept: "lazarsfeld-pattern",
  format: "Scenario A",
  prompt: "Z = finale episode. The early/late difference is about the same among finales and ordinary episodes. Which Lazarsfeld pattern?",
  context: scenarioTable("A"),
  options: PATTERNS({
    spec: "Specification needs the partial relationships to differ between the categories of Z. Here they are +27 and +28.",
    expl: "Explanation needs the relationship to weaken or disappear in the partial tables. It did not.",
    interp: "Interpretation also needs the relationship to weaken or disappear. It did not.",
  }),
  correct: "rep",
  explanation: `The partial relationships (+27, +28) look like the zero-order relationship (+${(LATE_PCT - EARLY_PCT).toFixed(0)}). Controlling for finales changes nothing essential: replication.`,
};

export const qLzB: ChoiceQuestion = {
  kind: "choice",
  id: "sop-lz-b",
  concept: "lazarsfeld-pattern",
  format: "Scenario B",
  prompt: "Same X, Y and Z, different hypothetical data. Which Lazarsfeld pattern?",
  context: scenarioTable("B"),
  options: PATTERNS({
    rep: "Replication needs both partial relationships to look like the zero-order one. Here one is +4 and the other +67.",
    expl: "The relationship does not disappear everywhere: among finales it is much stronger than in the zero-order table.",
    interp: "The relationship does not weaken in every partial table, and Z (finale) is not a mechanism between season period and violence.",
  }),
  correct: "spec",
  explanation:
    "The relationship is strong among finales (+67) but barely exists among ordinary episodes (+4). Z identifies the conditions under which the relationship differs: specification.",
};

export const qLzCWhere: ChoiceQuestion = {
  kind: "choice",
  id: "sop-lz-c-where",
  concept: "lazarsfeld-control",
  format: "Scenario C · Where does Z live in the story?",
  prompt:
    "Suppose the production budget increased over the course of the series. Proposed story: season period → production resources → visually elaborate (major) violence. Where does Z = production budget live in the story?",
  options: ZPOS({
    ante: "The budget increase happens because the series moves into its later seasons, not before them. In the proposed story Z comes after X.",
  }),
  correct: "inter",
  explanation: "Later seasons bring bigger budgets, and bigger budgets bring more elaborate violence: X → Z → Y. Z is intervening.",
};

export const qLzC: ChoiceQuestion = {
  kind: "choice",
  id: "sop-lz-c",
  concept: "lazarsfeld-pattern",
  format: "Scenario C",
  prompt: "Controlling for production budget, the season–violence relationship disappears. Which Lazarsfeld pattern?",
  context: scenarioTable("C"),
  options: PATTERNS({
    rep: "The relationship did not stay the same: it went from +28 to about +2 in both budget groups.",
    spec: "The partial relationships are the same as each other (both ≈ +2). They do not differ between the categories of Z.",
    expl: "Explanation needs an antecedent Z (Z before X). Budget is intervening: it comes after season period in the proposed story.",
  }),
  correct: "interp",
  explanation:
    "The relationship disappears and Z is intervening (X → Z → Y): interpretation. The season–violence relationship runs through production resources.",
};

export const qLzDWhere: ChoiceQuestion = {
  kind: "choice",
  id: "sop-lz-d-where",
  concept: "lazarsfeld-control",
  format: "Scenario D · Where does Z live in the story?",
  prompt:
    "Suppose a broader change in HBO programming policy came before both the later seasons and the change in content intensity. Where does Z = programming policy live in the story?",
  options: ZPOS({
    inter: "Intervening would mean the later seasons changed the policy, which then changed the content. Here the policy change comes first and affects both.",
  }),
  correct: "ante",
  explanation: "The policy change precedes X (the later seasons) and also affects Y: Z → X and Z → Y. Z is antecedent.",
};

export const qLzD: ChoiceQuestion = {
  kind: "choice",
  id: "sop-lz-d",
  concept: "lazarsfeld-pattern",
  format: "Scenario D",
  prompt: "Controlling for the programming-policy period, the original relationship disappears. Which Lazarsfeld pattern?",
  context: scenarioTable("D"),
  options: PATTERNS({
    rep: "The relationship did not survive control: +28 became about +2.",
    spec: "Both partial relationships are about +2. They do not differ between the categories of Z.",
    interp: "The tables look exactly like interpretation, but Z here is antecedent (it comes before X). Same tables, different story.",
  }),
  correct: "expl",
  explanation:
    "The relationship disappears and Z is antecedent: explanation. The original season–violence association is accounted for by the earlier policy change that affected both.",
};

/* ================= PART 6: Put the analysis in order ================= */

export const SOP_SEQUENCE: OrderQuestion = {
  kind: "order",
  id: "sop-lz-order",
  concept: "lazarsfeld-sequence",
  format: "Order the steps",
  prompt: "Put the five steps of the Lazarsfeld analysis in order.",
  items: [
    { id: "C", label: "C. Set up the two-dimensional and three-dimensional model.", why: "First the model: which variables are X, Y and Z, and how they might be connected." },
    { id: "B", label: "B. Formulate and interpret the two- and three-variable model and identify the role of the control variable.", why: "Then the hypotheses, and whether Z is antecedent or intervening. This must be decided before looking at the tables." },
    { id: "E", label: "E. Analyze the original two-dimensional crosstab.", why: "Then the zero-order relationship: percentages within X, χ², Cramer's V." },
    { id: "A", label: "A. Analyze the partial tables and compare them with the zero-order relationship.", why: "Only now the partial tables, each compared with the zero-order relationship and with each other." },
    { id: "D", label: "D. Summarize the findings and classify the result using Lazarsfeld's paradigm.", why: "Finally the classification: replication, specification, explanation or interpretation." },
  ],
  initial: ["A", "B", "C", "D", "E"],
  explanation:
    "We cannot say what changed after controlling for Z unless we first know what the original zero-order relationship looked like.",
};

/* ================= PART 7: Correlation ================= */

export const qCorLevels: ChoiceQuestion = {
  kind: "choice",
  id: "sop-cor-levels",
  concept: "measurement",
  format: "Measurement levels",
  prompt: "Research question: “Do longer episodes contain more violence?” What are the measurement levels of runtime_minutes and violence_event_count?",
  options: [
    { id: "a", label: "Both scale" },
    { id: "b", label: "runtime is scale, violence_event_count is ordinal", why: "A count of events has equal units (one event) and a true zero. That is scale, not merely ordered." },
    { id: "c", label: "Both ordinal", why: "Minutes and counts have meaningful distances: both are scale." },
  ],
  correct: "a",
  explanation: "Minutes and counts are both scale variables.",
};

export const qCorMethod: ChoiceQuestion = {
  kind: "choice",
  id: "sop-cor-method",
  concept: "pearson-spearman",
  format: "Pearson or Spearman?",
  prompt: "Two scale variables, and the scatterplot shows a roughly linear cloud without extreme outliers. Pearson or Spearman?",
  options: [
    { id: "pearson", label: "Pearson's r" },
    { id: "spearman", label: "Spearman's rho" },
    { id: "chi", label: "χ² test", why: "χ² is for categorical variables in a crosstab. Turning two scale variables into categories throws information away." },
  ],
  correct: "pearson",
  partial: {
    spearman:
      "Spearman is never wrong here (it only uses ranks), and some would choose it because counts are a little skewed. But with two scale variables and a roughly linear pattern, the course answer is Pearson.",
  },
  explanation: "Two scale variables with a roughly linear relationship: Pearson's r.",
};

export const qCorCause: ChoiceQuestion = {
  kind: "choice",
  id: "sop-cor-cause",
  concept: "correlation",
  format: "Can we say it?",
  prompt: `r = ${r2(RUNTIME_VIOLENCE.r)}, p ${formatP(RUNTIME_VIOLENCE.p)}, N = ${N}. Can we write: “Long episodes cause violence”?`,
  options: [
    {
      id: "yes",
      label: "Yes, the correlation is significant.",
      why: "Significance tells us the association is unlikely to be zero in the population. It says nothing about the direction of influence or third variables.",
    },
    { id: "no", label: "No" },
  ],
  correct: "no",
  explanation:
    "Correlation ≠ causation. The direction could even run the other way (episodes with a lot of plot, including violent plot, may be given more time), or a third variable such as a major storyline could drive both. We can only say the two are positively associated.",
};

export const qFuckMethod: ChoiceQuestion = {
  kind: "choice",
  id: "sop-cor-fuck",
  concept: "pearson-spearman",
  format: "Pearson or Spearman?",
  prompt: `fuck_count is strongly right-skewed and two episodes are extreme outliers. Pearson gives r = ${r2(RUNTIME_FUCK.r)}, Spearman gives rho = ${r2(RUNTIME_FUCK.rho)}. Which should you report?`,
  options: [
    { id: "pearson", label: "Pearson, because it is larger", why: "Choosing the coefficient that gives the nicer number is not a reason. Here Pearson is partly driven by the two outliers." },
    { id: "spearman", label: "Spearman's rho" },
    { id: "neither", label: "Neither: profanity cannot be measured", why: "It can be counted. Whether the count is a good measure of anything is a validity question, but it is clearly a count." },
  ],
  correct: "spearman",
  explanation:
    "With a strongly skewed variable and extreme outliers, a rank-based coefficient is safer: Spearman uses ranks, so the two outliers count as ‘the two highest’ rather than pulling the line towards themselves.",
};

export const qUShape: ChoiceQuestion = {
  kind: "choice",
  id: "sop-cor-ushape",
  concept: "correlation",
  format: "Nonlinearity trap",
  prompt: `Position in the series vs number of violent events: r = ${r2(ORDER_VIOLENCE.r)}. Does r ≈ 0 prove there is no relationship?`,
  options: [
    { id: "yes", label: "Yes: r ≈ 0 means the variables are unrelated.", why: "r ≈ 0 only rules out a linear relationship. Look at the plot: violence is high at the start, dips in the middle, and rises again." },
    { id: "no", label: "No" },
  ],
  correct: "no",
  explanation:
    "Pearson measures linear association. A U-shaped relationship can be obvious in the scatterplot while the rising and falling halves cancel out in r. Always look at the plot.",
};

/* ================= PART 9: The three t-tests ================= */

export const qTA: ChoiceQuestion = {
  kind: "choice",
  id: "sop-t-a",
  concept: "t-test-choice",
  format: "Question A",
  prompt: `“Is the average Sopranos episode longer than a hypothetical ${BENCHMARK}-minute benchmark?” Which test?`,
  options: TTESTS({
    ind: "There is only one group of episodes. The benchmark is a fixed number, not a second sample.",
    paired: "Paired tests need two measurements per episode. Here there is one measurement (runtime) and one fixed value.",
  }),
  correct: "one",
  explanation: `One mean compared with a fixed value: one-sample t-test, H₀: μ = ${BENCHMARK}.`,
};

export const qTAH0: ChoiceQuestion = {
  kind: "choice",
  id: "sop-t-a-h0",
  concept: "t-test-choice",
  format: "Question A · H₀",
  prompt: "What is H₀?",
  options: [
    { id: "a", label: `μ = ${BENCHMARK}` },
    { id: "b", label: `x̄ = ${BENCHMARK}`, why: "Hypotheses are about the population mean μ, not the sample mean x̄ (which we already know)." },
    { id: "c", label: `μ > ${BENCHMARK}`, why: "That is the research hypothesis. H₀ is the statement of no difference." },
  ],
  correct: "a",
  explanation: `H₀: the population mean runtime equals ${BENCHMARK} minutes.`,
};

export const qTB: ChoiceQuestion = {
  kind: "choice",
  id: "sop-t-b",
  concept: "t-test-choice",
  format: "Question B",
  prompt: "“Do episodes with a therapy scene have a different average violence count from episodes without a therapy scene?” Which test?",
  options: TTESTS({
    one: "We are not comparing one mean with a fixed number, but two groups of episodes with each other.",
    paired: "Each episode is either in the therapy group or not, never both. The groups are separate, not paired.",
  }),
  correct: "ind",
  explanation: "Two separate groups of episodes, a scale outcome: independent-samples t-test.",
};

export const qTBRoles: ChoiceQuestion = {
  kind: "choice",
  id: "sop-t-b-roles",
  concept: "roles",
  format: "Question B · variables",
  prompt: "Which is the grouping variable and which is the test (dependent) variable?",
  options: [
    { id: "a", label: "Grouping: therapy_scene; test variable: violence_event_count" },
    { id: "b", label: "Grouping: violence_event_count; test variable: therapy_scene", why: "Reversed: we compare mean violence (scale) between the two therapy groups." },
  ],
  correct: "a",
  explanation: "therapy_scene (0/1) defines the two groups; violence_event_count is the scale variable whose means are compared.",
};

export const qTC: ChoiceQuestion = {
  kind: "choice",
  id: "sop-t-c",
  concept: "t-test-choice",
  format: "Question C",
  prompt:
    "Every episode has two coded counts: family_conflict_count and crime_conflict_count. “Within the same episodes, are crime-related conflicts more frequent than family-related conflicts?” Which test?",
  options: TTESTS({
    one: "There is no fixed benchmark value; there are two measured variables.",
    ind: "The two counts are not from two separate groups of episodes: both come from every episode.",
  }),
  correct: "paired",
  explanation: "Two measurements on the same units (episodes): paired-samples t-test.",
};

export const qTCWhy: ChoiceQuestion = {
  kind: "choice",
  id: "sop-t-c-why",
  concept: "t-test-choice",
  format: "Question C · why paired?",
  prompt: "Why is it paired?",
  options: [
    { id: "a", label: "Because both variables are counts", why: "Two counts from two different groups of episodes would not be paired. Pairing is about where the values come from." },
    { id: "b", label: "Because both values come from the same episode" },
    { id: "c", label: "Because the means are close", why: "Pairing is a design property, decided before seeing any means." },
  ],
  correct: "b",
  explanation: "Each episode supplies one family count and one crime count, so the two values are linked. The test analyses the within-episode differences.",
};

/* ================= PART 10: t-test output ================= */

const [gT, gN] = THERAPY_GROUPS;
const sig = THERAPY_ROW.p < 0.05;

export const T_OUTPUT_QUESTIONS: ChoiceQuestion[] = [
  {
    kind: "choice",
    id: "sop-t-out-sig",
    concept: "t-test-output",
    format: "Output · 1",
    prompt: "Is the difference statistically significant at α = .05?",
    options: [
      { id: "yes", label: "Yes", why: sig ? undefined : `Sig. (2-tailed) = ${noLeadingZero(THERAPY_ROW.p, 3)} is above .05.` },
      { id: "no", label: "No", why: sig ? `Sig. (2-tailed) ${formatP(THERAPY_ROW.p)} is below .05.` : undefined },
    ],
    correct: sig ? "yes" : "no",
    explanation: `Levene's p = ${noLeadingZero(THERAPY_LEVENE.p, 3)} (≥ .05), so we read the ‘Equal variances assumed’ row: t(${THERAPY_ROW.df.toFixed(0)}) = ${THERAPY_ROW.t.toFixed(2)}, p ${formatP(THERAPY_ROW.p)}${sig ? ", below .05." : "."}`,
  },
  {
    kind: "choice",
    id: "sop-t-out-mean",
    concept: "t-test-output",
    format: "Output · 2",
    prompt: "Which group has the larger mean number of violent events?",
    options: [
      { id: "ther", label: "Episodes with a therapy scene", why: `M = ${gT.m.toFixed(2)} for therapy episodes vs ${gN.m.toFixed(2)} without. The negative t just means group 1 minus group 2 is negative.` },
      { id: "noth", label: "Episodes without a therapy scene" },
    ],
    correct: "noth",
    explanation: `Without therapy: M = ${gN.m.toFixed(2)}; with therapy: M = ${gT.m.toFixed(2)}. The mean difference (therapy − no therapy) is ${(gT.m - gN.m).toFixed(2)}, hence the negative t.`,
  },
  {
    kind: "choice",
    id: "sop-t-out-g",
    concept: "effect-size",
    format: "Output · 3",
    prompt: `Hedges' g = ${noLeadingZero(THERAPY_G)}. Is the effect small, moderate or large?`,
    options: [
      { id: "small", label: "Small", why: effectLabel(THERAPY_G) === "small" ? undefined : "Rules of thumb: about .2 small, .5 moderate, .8 large. Ignore the sign: it only shows direction." },
      { id: "moderate", label: "Moderate", why: effectLabel(THERAPY_G) === "moderate" ? undefined : "Rules of thumb: about .2 small, .5 moderate, .8 large." },
      { id: "large", label: "Large", why: "Large would be around .8 or more. Ignore the sign: it only shows direction." },
    ],
    correct: effectLabel(THERAPY_G),
    explanation: `|g| = ${noLeadingZero(Math.abs(THERAPY_G))}: the groups differ by about half a pooled standard deviation, ${effectLabel(THERAPY_G)} by the usual benchmarks (.2 / .5 / .8). The sign only tells us the therapy group is lower.`,
  },
  {
    kind: "choice",
    id: "sop-t-out-cause",
    concept: "t-test-output",
    format: "Output · 4",
    prompt: "Does this prove that therapy scenes reduce violence?",
    options: [
      { id: "yes", label: "Yes: the difference is significant and the effect is moderate.", why: "Neither significance nor effect size turns an observed association into a causal effect. Episodes were not randomly assigned to have therapy scenes." },
      { id: "no", label: "No" },
    ],
    correct: "no",
    explanation:
      "No causal conclusion. The result shows an association between episode type and average violence, not that therapy causes anything. Episodes built around Tony's inner life may simply be different kinds of episodes.",
  },
];

/* ================= PART 11: Levene mini-boss ================= */

export const qLevene1: ChoiceQuestion = {
  kind: "choice",
  id: "sop-t-lev-1",
  concept: "t-test-output",
  format: "Paulie's question",
  prompt: "Levene's test: p = .62. Which row do you read?",
  options: [
    { id: "eq", label: "Equal variances assumed" },
    { id: "neq", label: "Equal variances not assumed", why: "Levene's H₀ is ‘the variances are equal’. p = .62 gives no reason to reject it, so we keep the equal-variances row." },
  ],
  correct: "eq",
  explanation: "p ≥ .05: no evidence that the variances differ, so read the first row.",
};

export const qLevene2: ChoiceQuestion = {
  kind: "choice",
  id: "sop-t-lev-2",
  concept: "t-test-output",
  format: "Paulie's follow-up",
  prompt: "Levene's test: p = .012. Which row now?",
  options: [
    { id: "eq", label: "Equal variances assumed", why: "p < .05 rejects Levene's H₀ of equal variances, so the equal-variances row is no longer appropriate." },
    { id: "neq", label: "Equal variances not assumed" },
  ],
  correct: "neq",
  explanation: "p < .05: the variances differ, so read the second row (Welch's correction).",
};

/* ================= PART 12: Final boss ================= */

const finaleShare = EARLY_LATE_BY_FINALE.map((r) => (r[1] / (r[0] + r[1])) * 100);

export const BOSS_NUMBERS = {
  nonFinale: nf,
  finale: fi,
  finaleShare,
  nonFinaleP: P_TXT,
};

export const BOSS_QUESTIONS: ChoiceQuestion[] = [
  {
    kind: "choice",
    id: "sop-boss-xyz",
    concept: "roles",
    format: "Step 1 · roles",
    prompt:
      "“Did later Sopranos seasons become more violent, or is the apparent relationship mainly due to season finales?” Identify X, Y and Z.",
    options: PAIR(
      {
        a: "Finales are what we suspect might be behind the relationship: that makes finale the control variable, not X.",
        c: "The outcome is major violence, and the period is what we compare across. You reversed X and Y.",
        d: "The question mentions three variables, so this is a three-variable (Lazarsfeld) design.",
      },
      [
        "X = finale_episode, Y = major_violence, Z = early_late",
        "X = early_late, Y = major_violence, Z = finale_episode",
        "X = major_violence, Y = early_late, Z = finale_episode",
        "X = early_late, Y = major_violence, no Z",
      ],
    ),
    correct: "b",
    explanation: "X = early_late (what we compare across), Y = major_violence (the outcome), Z = finale_episode (the variable we hold constant).",
  },
  {
    kind: "choice",
    id: "sop-boss-levels",
    concept: "measurement",
    format: "Step 2 · measurement levels",
    prompt: "What are the measurement levels of early_late, major_violence and finale_episode?",
    options: [
      { id: "a", label: "All three are nominal (dichotomous)" },
      { id: "b", label: "early_late is scale because it is based on season numbers", why: "early_late itself has only two categories (0 = seasons 1–3, 1 = seasons 4–6). The variable in the analysis is dichotomous." },
      { id: "c", label: "major_violence is scale because it is coded 0/1", why: "0/1 codes are labels for two categories." },
    ],
    correct: "a",
    explanation: "Three dichotomous variables: a three-dimensional crosstab is the right tool.",
  },
  {
    kind: "choice",
    id: "sop-boss-pct",
    concept: "crosstab-percent",
    format: "Step 3 · zero-order table",
    prompt: "early_late is in the rows of the zero-order crosstab. Which percentages do you request and compare?",
    options: [
      { id: "row", label: "Row percentages: % with major violence among early vs late episodes" },
      { id: "col", label: "Column percentages: % of violent episodes that are from later seasons", why: "That is a percentage within Y. It answers where violent episodes come from, not whether later seasons are more likely to be violent." },
    ],
    correct: "row",
    explanation: `Within X: ${pct(EARLY_PCT)} of early-season vs ${pct(LATE_PCT)} of late-season episodes contain major violence.`,
  },
  {
    kind: "choice",
    id: "sop-boss-chi",
    concept: "p-value",
    format: "Step 4 · χ² and V",
    prompt: `Zero-order: χ²(1) = ${ZERO_ORDER_TEST.chi2.toFixed(2)}, p ${P_TXT}, Cramer's V = ${V_TXT}. What do you conclude?`,
    options: [
      { id: "a", label: "Reject H₀ of independence: there is evidence of a weak-to-moderate association." },
      { id: "b", label: "There is a 98% probability that later seasons are more violent.", why: "1 − p is not the probability that H₁ is true. p is computed assuming H₀." },
      { id: "c", label: "Strong association, because p < .05.", why: "Strength is V, not p. V ≈ .28 is weak-to-moderate." },
    ],
    correct: "a",
    explanation: "p < .05 → reject independence; V describes the strength as weak-to-moderate.",
  },
  {
    kind: "choice",
    id: "sop-boss-partial",
    concept: "lazarsfeld-pattern",
    format: "Step 5 · partial tables",
    prompt: "Now control for finale_episode. What happens to the early/late difference in the partial tables?",
    context: (
      <MiniTable
        caption="Partial tables from the dataset: % of episodes with major violence"
        head={["", "Seasons 1–3", "Seasons 4–6", "Difference"]}
        rows={[
          [`Zero-order (n = ${N})`, pct(EARLY_PCT), pct(LATE_PCT), `+${(LATE_PCT - EARLY_PCT).toFixed(1)}`],
          [
            `Ordinary episodes (n = ${PARTIAL_NON_FINALE.flat().reduce((a, b) => a + b, 0)})`,
            pct(nf[0][1]),
            pct(nf[1][1]),
            `+${(nf[1][1] - nf[0][1]).toFixed(1)}`,
          ],
          [
            `Finales (n = ${PARTIAL_FINALE.flat().reduce((a, b) => a + b, 0)})`,
            pct(fi[0][1]),
            pct(fi[1][1]),
            `+${(fi[1][1] - fi[0][1]).toFixed(1)}`,
          ],
        ]}
      />
    ),
    options: [
      { id: "same", label: "It stays roughly the same in both partial tables" },
      { id: "gone", label: "It disappears", why: "Among ordinary episodes the difference is still about the same as in the zero-order table." },
      { id: "only", label: "It only exists among finales", why: "The difference among ordinary episodes is almost as large as the zero-order one, so finales are not where the relationship comes from." },
    ],
    correct: "same",
    explanation: `Ordinary episodes: +${(nf[1][1] - nf[0][1]).toFixed(1)} points; finales: +${(fi[1][1] - fi[0][1]).toFixed(1)} points (but only ${PARTIAL_FINALE.flat().reduce((a, b) => a + b, 0)} finales, so that percentage moves 33 points per episode). The relationship survives control.`,
  },
  {
    kind: "choice",
    id: "sop-boss-pattern",
    concept: "lazarsfeld-pattern",
    format: "Step 6 · classification",
    prompt: "Which Lazarsfeld pattern?",
    options: PATTERNS({
      spec: "The finale partial table has only 6 episodes, so its +33 is not meaningfully different from +27. With so few finales we cannot claim the relationship differs by Z.",
      expl: "Explanation requires the relationship to weaken or disappear. It did not.",
      interp: "Interpretation requires the relationship to weaken or disappear. It did not.",
    }),
    correct: "rep",
    explanation: "The partial relationships look like the zero-order relationship: replication. The apparent season effect is not due to finales.",
  },
  {
    kind: "choice",
    id: "sop-boss-where",
    concept: "lazarsfeld-control",
    format: "Step 7 · Where does Z live in the story?",
    prompt: `Every season has exactly one finale, so finales make up ${pct(finaleShare[0])} of early and ${pct(finaleShare[1])} of late episodes. Is finale_episode antecedent, intervening, or neither?`,
    options: ZPOS(
      {
        ante: "An antecedent Z would come before X and influence it. Being a finale does not make an episode belong to a later season.",
        inter: "An intervening Z would be produced by X. Later seasons do not have more finales: every season has one.",
      },
      true,
    ),
    correct: "neither",
    explanation:
      "Finale status is a structural feature of an episode's position within a season. It is not caused by the season period and does not cause it, and it is (almost) unrelated to X. A Z that is unrelated to X cannot explain the X–Y relationship, which is why the result is replication.",
  },
  {
    kind: "choice",
    id: "sop-boss-causal",
    concept: "lazarsfeld-pattern",
    format: "Step 8 · claims",
    prompt: "Which claim is defensible?",
    options: [
      { id: "a", label: "Later seasons caused more major violence.", why: "These are observational (and here synthetic) data. Replication rules out one alternative explanation (finales), not all of them." },
      {
        id: "b",
        label: "Later-season episodes are more likely to contain major violence, and this association is not accounted for by season finales.",
      },
      { id: "c", label: "Season finales cause major violence.", why: "Finales were the control variable, and the analysis does not test their effect causally." },
    ],
    correct: "b",
    explanation:
      "We can describe the association and say it survives control for finales. We cannot claim causation: other variables (storylines, budget, policy) were not controlled.",
  },
];

/* ================= Profile categories ================= */

export type ProfileCategory = "levels" | "descriptives" | "crosstabs" | "p" | "lazarsfeld" | "correlation" | "t";

export const PROFILE_LABEL: Record<ProfileCategory, string> = {
  levels: "Measurement levels & roles",
  descriptives: "Frequencies",
  crosstabs: "Crosstabs",
  p: "p-values",
  lazarsfeld: "Lazarsfeld",
  correlation: "Correlation",
  t: "t-tests",
};

/** Which profile line each question counts towards. */
export const PROFILE_OF: Record<string, ProfileCategory> = Object.fromEntries([
  ...[...LEVEL_QUESTIONS, ...ROLE_QUESTIONS, BOSS_QUESTIONS[0], BOSS_QUESTIONS[1]].map((q) => [q.id, "levels"]),
  ...["sop-desc-read", ...DESC_QUESTIONS.map((q) => q.id)].map((id) => [id, "descriptives"]),
  ...[...CROSSTAB_QUESTIONS, qTempting, qCrosstabMethod, BOSS_QUESTIONS[2]].map((q) => [q.id, "crosstabs"]),
  ...[qTrial, qVerdictStrength, BOSS_QUESTIONS[3]].map((q) => [q.id, "p"]),
  ...[qLzA, qLzB, qLzCWhere, qLzC, qLzDWhere, qLzD, SOP_SEQUENCE, ...BOSS_QUESTIONS.slice(4)].map((q) => [q.id, "lazarsfeld"]),
  ...[qCorLevels, qCorMethod, qCorCause, qFuckMethod, qUShape].map((q) => [q.id, "correlation"]),
  ...["sop-cor-guess"].map((id) => [id, "correlation"]),
  ...[qTA, qTAH0, qTB, qTBRoles, qTC, qTCWhy, ...T_OUTPUT_QUESTIONS, qLevene1, qLevene2].map((q) => [q.id, "t"]),
]);

export { rLabel };
