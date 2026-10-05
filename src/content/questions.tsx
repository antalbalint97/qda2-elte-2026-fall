import { MiniTable } from "@/components/learning/MiniTable";
import { SpssOutput } from "@/components/learning/Spss";
import type { ChoiceQuestion, OrderQuestion, Question } from "./quiz-types";

const LEVELS = (why: { nominal?: string; ordinal?: string; scale?: string }) => [
  { id: "nominal", label: "Nominal", why: why.nominal },
  { id: "ordinal", label: "Ordinal", why: why.ordinal },
  { id: "scale", label: "Continuous / Scale", why: why.scale },
];

const XYZ = (why: { X?: string; Y?: string; Z?: string }) => [
  { id: "X", label: "Independent variable (X)", why: why.X },
  { id: "Y", label: "Dependent variable (Y)", why: why.Y },
  { id: "Z", label: "Control variable (Z)", why: why.Z },
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

/* ---------------- Measurement levels & roles ---------------- */

export const qPolInterest: ChoiceQuestion = {
  kind: "choice",
  id: "m-polint",
  concept: "measurement",
  format: "Classify variable",
  prompt: "Political interest is coded 1 = not at all, 2 = not very, 3 = fairly, 4 = very interested. What is its measurement level?",
  options: LEVELS({
    nominal:
      "You treated the categories as unordered, but ‘very interested’ clearly means more interest than ‘fairly interested’. The categories have an order.",
    scale:
      "You treated the codes 1–4 as real quantities. The numbers are only labels for ordered answers: the distance between ‘not at all’ and ‘not very’ need not equal the distance between ‘fairly’ and ‘very’.",
  }),
  correct: "ordinal",
  explanation:
    "The categories can be ranked, but the distances between them are not meaningful. That is the definition of an ordinal variable.",
};

export const qChildren: ChoiceQuestion = {
  kind: "choice",
  id: "m-children",
  concept: "measurement",
  format: "Classify variable",
  prompt: "Number of children (0, 1, 2, 3, …). What is its measurement level?",
  options: LEVELS({
    nominal: "The values are not just labels: 3 children is more than 2, so there is an order.",
    ordinal:
      "There is an order, but you missed that the distances are also meaningful: the difference between 1 and 2 children is the same one child as between 3 and 4.",
  }),
  correct: "scale",
  explanation:
    "It is a count: values are ordered, equal differences mean the same thing, and 0 means none. Counts are treated as scale variables.",
};

export const qLevelVsRole: ChoiceQuestion = {
  kind: "choice",
  id: "m-level-role",
  concept: "roles",
  format: "Binary choice",
  prompt: "True or false: a variable's measurement level changes depending on whether it is used as X or as Z.",
  options: [
    { id: "true", label: "True", why: "You mixed up measurement level and variable role. The role comes from the research question; the level comes from how the variable is measured." },
    { id: "false", label: "False" },
  ],
  correct: "false",
  explanation:
    "Measurement level is a property of the variable itself. Role (X, Y, Z) is a property of the research design. Age in years is scale whether it is the independent variable or the control variable.",
};

export const qAgeRole: ChoiceQuestion = {
  kind: "choice",
  id: "m-age-role",
  concept: "roles",
  format: "Identify role",
  prompt:
    "Research question: “Do men and women differ in trust in parliament, and does this difference hold within each age group?” What is the role of age?",
  options: XYZ({
    X: "Age is not the variable whose categories we compare first; gender is. Gender is X.",
    Y: "The outcome we compare is trust in parliament, so trust is Y.",
  }),
  correct: "Z",
  explanation:
    "Gender is X, trust in parliament is Y, and age is the variable within whose categories we re-examine the X–Y relationship. That makes age the control variable Z.",
};

/* ---------------- Crosstabs ---------------- */

export const qRowCol: ChoiceQuestion = {
  kind: "choice",
  id: "c-rowcol",
  concept: "crosstab-percent",
  format: "Choose percentage direction",
  prompt:
    "X = age group is in the rows, Y = speaks a foreign language (yes / no) is in the columns. Which percentages should we compare?",
  options: [
    { id: "row", label: "Row percentages" },
    {
      id: "col",
      label: "Column percentages",
      why: "You selected column percentages. Here the independent variable is age, and it is in the rows, so we want the distribution of the dependent variable within each age group. The relevant denominator is each age group, i.e. each row.",
    },
    {
      id: "total",
      label: "Total percentages",
      why: "Total percentages divide by the whole sample, so they mix the size of the age groups with the language pattern. They do not let us compare Y across categories of X.",
    },
  ],
  correct: "row",
  explanation:
    "Percentages are computed within categories of X so we can compare Y across them. X is in the rows here, so each row sums to 100%: compare the share who speak a foreign language across age groups.",
};

export const qColWhenXInCols: ChoiceQuestion = {
  kind: "choice",
  id: "c-colx",
  concept: "crosstab-percent",
  format: "Choose percentage direction",
  prompt: "Now education (X) is placed in the columns and voted in the last election (Y) in the rows. Which percentages?",
  options: [
    {
      id: "row",
      label: "Row percentages",
      why: "You chose by habit (‘row %’), not by the position of X. Here X is in the columns, so row percentages would give the education distribution of voters and non-voters, which answers a different question.",
    },
    { id: "col", label: "Column percentages" },
  ],
  correct: "col",
  explanation:
    "The rule is not ‘always row %’. The rule is ‘percentage within categories of X’. With X in the columns, each column should sum to 100%.",
};

export const qChiV: ChoiceQuestion = {
  kind: "choice",
  id: "c-chiv",
  concept: "chi-square",
  format: "Interpret SPSS output",
  prompt: "Settlement type × voted. χ²(3) = 48.3, p < .001, Cramer's V = .07, N = 9,812. Which summary is most defensible?",
  options: [
    {
      id: "strong",
      label: "There is a strong association, because p < .001.",
      why: "You confused statistical significance with effect size. A tiny p comes easily from a huge N; strength is read from Cramer's V, which is only .07.",
    },
    { id: "weak", label: "There is statistically significant evidence of an association, but it is weak." },
    {
      id: "none",
      label: "There is no association, because V is close to 0.",
      why: "V = .07 is weak, not zero, and the χ² test gives clear evidence that the variables are not independent in the population.",
    },
    {
      id: "cause",
      label: "Settlement type has a significant effect on voting.",
      why: "A crosstab from a cross-sectional survey shows association, not effect. Use ‘is associated with’ rather than ‘affects’.",
    },
  ],
  correct: "weak",
  explanation:
    "Chi-square answers ‘is there evidence of an association?’ (yes, p < .001). Cramer's V answers ‘how strong?’ (.07, weak). With almost 10,000 respondents, even weak associations are statistically significant.",
};

export const qMissing: ChoiceQuestion = {
  kind: "choice",
  id: "c-missing",
  concept: "crosstab-percent",
  format: "Multiple choice",
  prompt: "Trust in parliament has the codes 1–4 plus 8 = don't know and 9 = refused. What should happen before you run the crosstab?",
  options: [
    {
      id: "keep",
      label: "Keep them: they are valid answers and should be in the denominator.",
      why: "Nonresponse codes are not categories of the concept being measured. Leaving them in changes every percentage and distorts the comparison.",
    },
    { id: "missing", label: "Define 8 and 9 as missing values so only valid categories are analysed." },
    {
      id: "recode",
      label: "Recode them as the middle category.",
      why: "That invents answers respondents did not give and creates an artificial pattern.",
    },
  ],
  correct: "missing",
  explanation:
    "Only valid categories belong in the table. In SPSS, set 8 and 9 in the Missing column of Variable View (or recode them to system-missing) and report the number of valid cases.",
};

export const qExpected: ChoiceQuestion = {
  kind: "choice",
  id: "c-expected",
  concept: "chi-square",
  format: "Interpret SPSS output",
  prompt: "Under the Chi-Square Tests table SPSS writes: “4 cells (33.3%) have expected count less than 5.” What does this tell you?",
  options: [
    {
      id: "sig",
      label: "The association is significant.",
      why: "The footnote is about whether the test can be trusted, not about its result.",
    },
    {
      id: "unreliable",
      label: "The χ² approximation may be unreliable; consider merging sparse categories.",
    },
    {
      id: "weak",
      label: "The association is weak.",
      why: "Expected counts say nothing about strength. Strength is read from Cramer's V.",
    },
  ],
  correct: "unreliable",
  explanation:
    "The chi-square test relies on expected counts that are not too small (rule of thumb: at most 20% of cells below 5, none below 1). Here 33% are below 5, so merge categories or interpret with caution.",
};

/* ---------------- p-values ---------------- */

export const qPMeaning: ChoiceQuestion = {
  kind: "choice",
  id: "p-meaning",
  concept: "p-value",
  format: "Interpret p",
  prompt: "A one-sample t-test gives p = .03. Which statement is correct?",
  options: [
    {
      id: "h0",
      label: "There is a 3% probability that the null hypothesis is true.",
      why: "The p-value is computed assuming H₀ is true, so it cannot be the probability that H₀ is true.",
    },
    {
      id: "chance",
      label: "There is a 3% probability that the result is due to chance.",
      why: "This is a common misreading. p is not the probability that ‘chance’ produced the result; it is how unusual the result would be if H₀ were true.",
    },
    { id: "correct", label: "If H₀ were true, a result at least this extreme would occur about 3% of the time." },
    {
      id: "effect",
      label: "The difference is small, only 3%.",
      why: "You confused the p-value with effect size. p says nothing directly about how large the difference is.",
    },
  ],
  correct: "correct",
  explanation:
    "The p-value measures how unusual the observed result would be if the null hypothesis were true. Since .03 < .05, we reject H₀ at α = .05.",
};

export const qStudyAB: ChoiceQuestion = {
  kind: "choice",
  id: "p-study-ab",
  concept: "effect-size",
  format: "Interpret p",
  prompt:
    "Study A: mean difference 0.4 points on a 0–100 scale, N = 50,000, p < .001. Study B: mean difference 6 points, N = 40, p = .08. Which study found the larger effect?",
  options: [
    {
      id: "a",
      label: "Study A, because its p-value is smaller.",
      why: "You confused statistical significance with effect size. Study A's p is tiny because N is huge, not because the difference is large.",
    },
    { id: "b", label: "Study B" },
  ],
  correct: "b",
  explanation:
    "Study B's difference (6 points) is fifteen times larger than Study A's (0.4 points). B is not significant because with N = 40 the standard error is large. Statistical significance ≠ substantive importance.",
};

export const qPN: ChoiceQuestion = {
  kind: "choice",
  id: "p-n",
  concept: "effect-size",
  format: "Binary choice",
  prompt: "True or false: if the observed mean difference stays the same, a larger sample tends to give a smaller p-value.",
  options: [
    { id: "true", label: "True" },
    {
      id: "false",
      label: "False",
      why: "A larger N shrinks the standard error, so the same difference becomes a larger test statistic and lies further in the tail of the null distribution.",
    },
  ],
  correct: "true",
  explanation: "t = difference / (s/√n). As n grows, s/√n shrinks, t grows, and the tail area (p) shrinks.",
};

export const qPNonSig: ChoiceQuestion = {
  kind: "choice",
  id: "p-nonsig",
  concept: "p-value",
  format: "Interpret p",
  prompt: "An independent-samples t-test gives p = .20. What is the most defensible conclusion?",
  options: [
    {
      id: "true",
      label: "The null hypothesis is true: the groups have equal means.",
      why: "A non-significant result does not prove H₀. It only means the data are not unusual enough under H₀ to reject it.",
    },
    { id: "fail", label: "We cannot reject H₀; the data do not provide sufficient evidence of a difference." },
    {
      id: "twenty",
      label: "The groups differ by 20%.",
      why: "You confused the p-value with the size of the difference.",
    },
  ],
  correct: "fail",
  explanation:
    "p = .20 > .05, so we do not reject H₀. ‘No evidence of a difference’ is not ‘evidence of no difference’, especially in small samples.",
};

/* ---------------- Lazarsfeld ---------------- */

const lzTable = (z1: string, z2: string, rows: [string, string, string, string]) => (
  <MiniTable
    caption="% politically active, by education (X) and control variable (Z)"
    head={["", "Zero-order", z1, z2]}
    rows={[
      ["Low education", rows[0].split("|")[0], rows[1].split("|")[0], rows[2].split("|")[0]],
      ["High education", rows[0].split("|")[1], rows[1].split("|")[1], rows[2].split("|")[1]],
      ["Difference", rows[3].split("|")[0], rows[3].split("|")[1], rows[3].split("|")[2]],
    ]}
  />
);

export const qLzReplication: ChoiceQuestion = {
  kind: "choice",
  id: "l-rep",
  concept: "lazarsfeld-pattern",
  format: "Identify Lazarsfeld pattern",
  prompt: "X = education, Y = political participation, Z = gender. Which pattern does the table show?",
  context: lzTable("Women", "Men", ["22%|47%", "21%|45%", "23%|49%", "+25 pp|+24 pp|+26 pp"]),
  options: PATTERNS({
    spec: "Specification needs the X–Y relationship to differ between the partial tables. Here it is +24 and +26 points: practically the same.",
    expl: "Explanation needs the relationship to weaken or disappear in the partial tables. It stays at about +25 points.",
    interp: "Interpretation needs the relationship to weaken or disappear. It stays at about +25 points.",
  }),
  correct: "rep",
  explanation:
    "The partial relationships (+24, +26 pp) are about the same as the zero-order relationship (+25 pp). Controlling for gender does not change the pattern: replication.",
};

export const qLzSpecification: ChoiceQuestion = {
  kind: "choice",
  id: "l-spec",
  concept: "lazarsfeld-pattern",
  format: "Identify Lazarsfeld pattern",
  prompt: "X = education, Y = political participation, Z = settlement type. Which pattern does the table show?",
  context: lzTable("Village", "City", ["22%|47%", "24%|27%", "20%|64%", "+25 pp|+3 pp|+44 pp"]),
  options: PATTERNS({
    rep: "Replication means the relationship is about the same in every partial table. Here it is +3 points in villages but +44 in cities.",
    expl: "Explanation means the relationship weakens or disappears in all partial tables. Here it is strong in one subgroup and nearly absent in the other: it differs by subgroup.",
    interp: "Interpretation means the relationship weakens or disappears in all partial tables, not only in one.",
  }),
  correct: "spec",
  explanation:
    "The X–Y relationship differs substantially between the categories of Z (+3 vs +44 points). Z specifies the conditions under which the association appears.",
};

export const qLzAntecedent: ChoiceQuestion = {
  kind: "choice",
  id: "l-antecedent",
  concept: "lazarsfeld-control",
  format: "Antecedent or intervening",
  prompt: "X = respondent's education, Y = income, Z = parents' social class. Where does Z sit?",
  options: [
    { id: "ante", label: "Antecedent: Z → X → Y" },
    {
      id: "inter",
      label: "Intervening: X → Z → Y",
      why: "Parents' social class is fixed before the respondent completes education, so it cannot be a step between education and income.",
    },
  ],
  correct: "ante",
  explanation:
    "Parents' social class comes before the respondent's education in time. A variable that precedes X is an antecedent control variable.",
};

export const qLzInterpretation: ChoiceQuestion = {
  kind: "choice",
  id: "l-interp",
  concept: "lazarsfeld-pattern",
  format: "Identify Lazarsfeld pattern",
  prompt:
    "X = education, Y = political participation, Z = political interest (proposed mechanism: education → interest → participation). Within each level of interest, the education–participation relationship nearly disappears. Which pattern is this?",
  options: PATTERNS({
    rep: "Replication requires the relationship to stay the same. Here it nearly disappears.",
    spec: "Specification requires the relationship to differ between subgroups. Here it weakens in all of them.",
    expl: "You selected explanation, but Z lies between X and Y in the proposed mechanism. This is interpretation.",
  }),
  correct: "interp",
  explanation:
    "The relationship weakens strongly after controlling for Z, and Z is intervening (X → Z → Y). The original association operates through political interest: interpretation.",
};

export const qLzWhy2D: ChoiceQuestion = {
  kind: "choice",
  id: "l-why2d",
  concept: "lazarsfeld-sequence",
  format: "Multiple choice",
  prompt: "Why do we analyse the two-dimensional (X × Y) crosstab before the three-dimensional one?",
  options: [
    {
      id: "spss",
      label: "Because SPSS cannot produce three-dimensional tables directly.",
      why: "SPSS can produce layered crosstabs directly. The reason is logical, not technical.",
    },
    { id: "baseline", label: "Because the 3D analysis asks what changes relative to the original zero-order relationship." },
    {
      id: "sig",
      label: "Because only significant 2D relationships can be controlled.",
      why: "Even a non-significant zero-order relationship can be informative after control (for example, a suppressed relationship). The 2D table is the baseline, not a filter.",
    },
  ],
  correct: "baseline",
  explanation:
    "Replication, specification, explanation and interpretation are all defined by comparison with the zero-order relationship. Without it, there is nothing to compare the partial tables with.",
};

export const LAZARSFELD_SEQUENCE: OrderQuestion = {
  kind: "order",
  id: "l-sequence",
  concept: "lazarsfeld-sequence",
  format: "Order steps",
  prompt: "Put the steps of a Lazarsfeld analysis in the correct order.",
  items: [
    {
      id: "model",
      label: "Set up the two-dimensional and three-dimensional model.",
      why: "First decide what X, Y and Z are and draw the model. Without it you do not know which tables to request.",
    },
    {
      id: "hyp",
      label: "Interpret the model, formulate hypotheses, and identify the type of control variable.",
      why: "Before looking at data, state what you expect and whether Z is antecedent or intervening. That classification is needed later to tell explanation from interpretation.",
    },
    {
      id: "2d",
      label: "Prepare and analyse the two-dimensional crosstab.",
      why: "The zero-order X–Y relationship is the baseline. Every Lazarsfeld pattern is defined relative to it.",
    },
    {
      id: "3d",
      label: "Analyse the three-dimensional crosstab: inspect the partial tables and compare them with the zero-order relationship.",
      why: "Now hold Z constant. Each partial table shows the X–Y relationship within one category of Z.",
    },
    {
      id: "sum",
      label: "Summarise the results and classify the pattern within Lazarsfeld's paradigm.",
      why: "Only after the comparison can you say whether the relationship was replicated, specified, explained or interpreted.",
    },
  ],
  initial: ["2d", "sum", "model", "3d", "hyp"],
  explanation:
    "Model → hypotheses and type of Z → zero-order table → partial tables compared with the zero-order table → classification.",
};

/* ---------------- Correlation ---------------- */

export const qCorrOutput: ChoiceQuestion = {
  kind: "choice",
  id: "k-output",
  concept: "correlation",
  format: "Interpret SPSS output",
  prompt: "Daily hours of TV viewing and trust in other people (0–10). How do you read this output?",
  context: (
    <SpssOutput
      title="Correlations"
      headers={["", "", "TV hours", "Social trust"]}
      rows={[
        ["TV hours", "Pearson Correlation", "1", "-.42"],
        ["", "Sig. (2-tailed)", "", "<.001"],
        ["", "N", "850", "850"],
      ]}
    />
  ),
  options: [
    { id: "modneg", label: "Moderate negative association, statistically significant." },
    {
      id: "weakneg",
      label: "Weak negative association, not significant.",
      why: "Sig. < .001 is well below .05, so the association is statistically significant; |r| = .42 is usually called moderate.",
    },
    {
      id: "cause",
      label: "Watching TV reduces social trust by .42 points per hour.",
      why: "r is not a slope in original units and does not establish causation. It describes the direction and strength of a linear association.",
    },
    {
      id: "pos",
      label: "Moderate positive association.",
      why: "The minus sign shows direction: more TV hours go together with lower trust.",
    },
  ],
  correct: "modneg",
  explanation:
    "r = −.42: negative direction (higher TV hours, lower trust), moderate strength, p < .001 with N = 850. It is an association, not a demonstrated effect.",
};

export const qCorrU: ChoiceQuestion = {
  kind: "choice",
  id: "k-ushape",
  concept: "correlation",
  format: "Interpret r",
  prompt: "Pearson's r between age and weekly hours of internet use is .03, but the scatterplot shows a clear inverted-U shape. What do you conclude?",
  options: [
    {
      id: "none",
      label: "Age and internet use are unrelated.",
      why: "r ≈ 0 only rules out a linear association. The scatterplot shows a strong nonlinear pattern that r cannot capture.",
    },
    { id: "nonlin", label: "There is no linear association, but there may be a nonlinear relationship." },
    {
      id: "weak",
      label: "There is a weak positive relationship.",
      why: "With r = .03 the linear association is practically zero; the shape of the cloud, not r, is the important information here.",
    },
  ],
  correct: "nonlin",
  explanation: "r = 0 means no linear association. It does not necessarily mean no association. Always look at the scatterplot.",
};

export const qPearsonSpearmanOrd: ChoiceQuestion = {
  kind: "choice",
  id: "k-spearman",
  concept: "pearson-spearman",
  format: "Choose method",
  prompt: "Political interest (1–4, ordered categories) and level of education (6 ordered categories). Which correlation?",
  options: [
    {
      id: "pearson",
      label: "Pearson",
      why: "Pearson treats the codes as equally spaced quantities. With ordinal variables the distances between codes are not meaningful.",
    },
    { id: "spearman", label: "Spearman" },
  ],
  correct: "spearman",
  explanation: "Both variables are ordinal, so use Spearman's rank correlation, a rank-based measure of monotonic association.",
};

export const qPearsonScale: ChoiceQuestion = {
  kind: "choice",
  id: "k-pearson",
  concept: "pearson-spearman",
  format: "Choose method",
  prompt: "Weekly working hours and monthly net income, both scale; the scatterplot looks roughly linear. Which correlation?",
  options: [
    { id: "pearson", label: "Pearson" },
    {
      id: "spearman",
      label: "Spearman",
      why: "Spearman would be acceptable, but it throws away information about distances. With two scale variables and a roughly linear pattern, Pearson is the standard choice.",
    },
  ],
  correct: "pearson",
  explanation: "Two scale variables with a roughly linear relationship: Pearson's r is appropriate.",
};

export const qCorrCause: ChoiceQuestion = {
  kind: "choice",
  id: "k-cause",
  concept: "correlation",
  format: "Binary choice",
  prompt: "Years of education and income correlate at r = .48 (p < .001) in a cross-sectional survey. Can we conclude that education increases income?",
  options: [
    {
      id: "yes",
      label: "Yes",
      why: "A correlation from cross-sectional data shows association only. Other variables (for example, family background) could be related to both, and the direction is not established by r.",
    },
    { id: "no", label: "No, not from this alone" },
  ],
  correct: "no",
  explanation:
    "We can say education and income are positively associated (moderate, significant). Causal claims need a design that supports them; correlation alone does not.",
};

/* ---------------- t-tests ---------------- */

export const qTPaired: ChoiceQuestion = {
  kind: "choice",
  id: "t-paired",
  concept: "t-test-choice",
  format: "Choose t-test",
  prompt: "Each respondent rates both the education system and the healthcare system on a 0–10 scale. Do the ratings differ?",
  options: TTESTS({
    one: "There is no fixed reference value here; we compare two ratings with each other.",
    ind: "You chose an independent-samples t-test, but the two values come from the same respondents.",
  }),
  correct: "paired",
  explanation:
    "Both measurements come from the same people, so the test works with each person's difference (education − healthcare). That is a paired-samples t-test.",
};

export const qTOne: ChoiceQuestion = {
  kind: "choice",
  id: "t-one",
  concept: "t-test-choice",
  format: "Choose t-test",
  prompt: "Is the average interview completion time equal to 60 minutes?",
  options: TTESTS({
    ind: "There is only one group of interviews. The comparison is with a fixed value (60), not with another group.",
    paired: "There are not two measurements per interview; there is one variable compared with a fixed value.",
  }),
  correct: "one",
  explanation: "One sample mean compared with a known or theoretical value (60 minutes): one-sample t-test.",
};

export const qTInd: ChoiceQuestion = {
  kind: "choice",
  id: "t-ind",
  concept: "t-test-choice",
  format: "Choose t-test",
  prompt: "Do politically interested and politically uninterested respondents differ in happiness (0–10)?",
  options: TTESTS({
    one: "We are not comparing with a fixed number; we compare two groups' means.",
    paired: "Each respondent belongs to only one group; the two groups contain different people.",
  }),
  correct: "ind",
  explanation:
    "Two separate groups of respondents, one dependent variable (happiness): independent-samples t-test with political interest (dichotomised) as the grouping variable.",
};

export const qLevene: ChoiceQuestion = {
  kind: "choice",
  id: "t-levene",
  concept: "t-test-output",
  format: "Interpret SPSS output",
  prompt: "In an independent-samples t-test, Levene's test gives Sig. = .003. Which row of the t-test table do you read?",
  options: [
    {
      id: "assumed",
      label: "Equal variances assumed",
      why: "Levene's p < .05 means the group variances differ significantly, so the equal-variance assumption is not reasonable.",
    },
    { id: "not", label: "Equal variances not assumed" },
  ],
  correct: "not",
  explanation:
    "Levene's test asks whether the group variances can be treated as equal. p = .003 < .05, so read the ‘Equal variances not assumed’ row.",
};

export const qTOutput: ChoiceQuestion = {
  kind: "choice",
  id: "t-output",
  concept: "t-test-output",
  format: "Interpret SPSS output",
  prompt: "Happiness by political interest. Levene's Sig. = .41. How do you report the result?",
  context: (
    <SpssOutput
      title="Independent Samples Test (excerpt)"
      headers={["", "t", "df", "Sig. (2-tailed)", "Mean Difference"]}
      rows={[
        ["Equal variances assumed", "2.14", "1198", ".033", ".31"],
        [{ v: "Equal variances not assumed", dim: true }, { v: "2.13", dim: true }, { v: "1150.6", dim: true }, { v: ".034", dim: true }, { v: ".31", dim: true }],
      ]}
    />
  ),
  options: [
    { id: "sig", label: "Interested respondents are on average 0.31 points happier; the difference is statistically significant (p = .033)." },
    {
      id: "cause",
      label: "Political interest makes people 0.31 points happier.",
      why: "The groups were not randomly assigned. The difference is an association, not an effect of interest.",
    },
    {
      id: "nonsig",
      label: "The difference is not significant, because Levene's test is not significant.",
      why: "Levene's test only decides which row to read. The significance of the mean difference is read from Sig. (2-tailed) in that row.",
    },
  ],
  correct: "sig",
  explanation:
    "Levene's p = .41 ≥ .05, so read the ‘Equal variances assumed’ row: t(1198) = 2.14, p = .033, mean difference 0.31 on a 0–10 scale. Significant, but a small difference substantively.",
};

export const qEffectSize: ChoiceQuestion = {
  kind: "choice",
  id: "t-effect",
  concept: "effect-size",
  format: "Interpret p",
  prompt: "With N = 12,000, men and women differ in life satisfaction with p < .001 and Cohen's d = 0.08. What is the best summary?",
  options: [
    {
      id: "large",
      label: "A large and important gender difference.",
      why: "You confused statistical significance with effect size. d = 0.08 is far below even the ‘small’ benchmark of 0.2.",
    },
    { id: "tiny", label: "A statistically significant but very small difference." },
    {
      id: "none",
      label: "No difference at all.",
      why: "The difference is very small but the test gives clear evidence that it is not exactly zero in the population.",
    },
  ],
  correct: "tiny",
  explanation: "Significant does not mean large. With a huge N, even d = 0.08 is significant; relative to the spread of scores it is negligible.",
};

/* ---------------- Banks ---------------- */

export const QUICK_REVIEW: Question[] = [
  qPolInterest,
  qRowCol,
  qPMeaning,
  qLzReplication,
  qTPaired,
  qCorrOutput,
  qLevelVsRole,
  qChiV,
  qStudyAB,
  qLzInterpretation,
  qPearsonSpearmanOrd,
  qTOne,
  qChildren,
  qColWhenXInCols,
  qLzSpecification,
  LAZARSFELD_SEQUENCE,
  qCorrU,
  qTInd,
  qAgeRole,
  qMissing,
  qPN,
  qLzAntecedent,
  qLevene,
  qCorrCause,
  qExpected,
  qPNonSig,
  qLzWhy2D,
  qPearsonScale,
  qTOutput,
  qEffectSize,
];
