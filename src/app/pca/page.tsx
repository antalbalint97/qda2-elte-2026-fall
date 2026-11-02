import type { Metadata } from "next";
import { ModuleShell, Step } from "@/components/learning/ModuleShell";
import { PCAExplorer } from "@/components/modules/pca/PCAExplorer";
import { MODULES } from "@/content/modules";

export const metadata: Metadata = { title: "Principal Component Analysis" };
const meta = MODULES.find(m => m.slug === "pca")!;

const quiz = [
  { question: "The five-item SPSS output gives V43 communality .232. What does the course workflow suggest?", choices: ["Remove V43 and rerun PCA", "Keep it because it is positive", "Multiply every response by .232"], correct: 0, why: "The handout's classroom cutoff is .25, so .232 is below it. The next run can change the other communalities." },
  { question: "The final solution has eigenvalues 1.431, .902, .667. How much standardized variance does PC1 retain?", choices: ["1.431%", "47.694%", "100%"], correct: 1, why: "Three standardized variables have total variance 3. Divide 1.431 by 3, then multiply by 100." },
  { question: "V42 loading = .790. What is the corresponding communality?", choices: ["About .624", "Exactly .790", "About .210"], correct: 0, why: ".790 squared is approximately .624 (the published communality is .623, due to rounding)." },
  { question: "Does a positive component loading prove that the item causes the component?", choices: ["Yes", "No"], correct: 1, why: "A loading describes correlation with the component, not causation." },
] as const;

export default function PCAPage() {
  return <ModuleShell meta={meta} lede={<p className="font-serif text-2xl text-ink">From five survey questions to one principal component: learn what SPSS preserves, what it loses, and what the new score means.</p>}>
    <Step kind="understand" id="understand" title="Why create a composite variable?" intro="Based on QA2 Composite variables, data reduction methods (course handout, pp. 1–9).">
      <div className="grid gap-4 md:grid-cols-3">
        {[
          ["Index","Align items and average them. Often equal weights; examine internal consistency with Cronbach's alpha."],
          ["Sum of Z-scores","Standardize before summing. For binary possessions, owning a rare item earns a large positive Z; lacking a common item gives a large negative Z."],
          ["Principal components","Use linear combinations of standardized items to retain as much total variance as possible in PC1; later components are uncorrelated with PC1."],
        ].map(([title,body])=><div className="rounded-xl border border-line bg-surface p-5" key={title}><h3 className="text-xl font-semibold text-ink">{title}</h3><p className="mt-3 text-sm leading-relaxed text-muted">{body}</p></div>)}
      </div>
      <div className="mt-5 rounded-xl border border-line bg-surface-2 p-5 text-sm leading-relaxed text-ink">
        <strong>Standardization:</strong> Z = (X − mean) / SD. A washing machine (88.6% ownership) earns about +0.36 if owned and −2.79 if absent; a second property (7.4%) earns about +3.55 if owned and −0.28 if absent in the course example. These are handout values, not a live survey.
      </div>
      <p className="mt-4 text-sm text-muted">PCA compresses observed variance; it is distinct from factor analysis, which models shared variation through latent factors and unique/error components (handout p. 17). Neither automatically establishes validity or causality.</p>
    </Step>
    <Step kind="try" id="try" title="Which items belong in PC1?" intro="Follow the actual SPSS teaching example: Hungarian respondents' attitudes (ISSP 2013, V40–V44). Move through the documented removal sequence, then interpret the final solution.">
      <PCAExplorer />
    </Step>
    <Step kind="spss" id="spss" title="Read the SPSS output before saving scores" intro="Course handout pp. 9–16. The reported results are historical classroom outputs, not generated from an available raw data file.">
      <div className="space-y-5">
        <div className="rounded-xl border border-line bg-surface p-5">
          <h3 className="font-semibold text-ink">SPSS menu and decisions</h3>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-muted">
            <li>Check missing values and measurement levels. Choose Analyze → Dimension Reduction → Factor.</li>
            <li>Select V40–V44. Under Extraction choose Principal Components and a fixed number of 1 component.</li>
            <li>Read Communalities. The handout removes V43 first, reruns, then removes V40.</li>
            <li>For V41, V42, V44, read Total Variance Explained (47.694%) and Component Matrix (.645, .790, .626).</li>
            <li>Once satisfied, open Scores → Save as variables; inspect and label the new standardized component score.</li>
          </ol>
        </div>
        <div className="rounded-xl border border-line bg-surface-2 p-5">
          <h3 className="font-semibold text-ink">SPSS syntax: reproduce the workflow</h3>
          <pre className="mt-3 overflow-x-auto whitespace-pre-wrap rounded-lg bg-bg p-4 font-mono text-xs text-ink">{`FACTOR
  /VARIABLES V41 V42 V44
  /MISSING LISTWISE
  /ANALYSIS V41 V42 V44
  /PRINT INITIAL EXTRACTION
  /CRITERIA FACTORS(1)
  /EXTRACTION PC
  /ROTATION NOROTATE
  /SAVE REG(ALL).
`}</pre>
          <p className="mt-3 text-sm text-muted">SPSS typically saves FAC1_1. Rename and label it after checking which direction higher scores represent; the sign of a principal component is arbitrary. The original handout labels the resulting score econpolicy.</p>
        </div>
        <div className="rounded-xl border border-line bg-surface p-5">
          <h3 className="font-semibold text-ink">Report your conclusion</h3>
          <p className="mt-3 text-sm leading-relaxed text-muted">The three-item PC1 retains 47.694% of their standardized total variance (eigenvalue 1.431); communalities are .416, .623 and .392, respectively. Report the observed loadings, the meaning of high scores, missing-case handling and the retained variance. The handout reports N = 926 for saved scores.</p>
        </div>
      </div>
    </Step>
    <Step kind="test" id="test" title="Exit ticket: interpret, don't just click" intro="Answer these four questions, then check the reasoning.">
      <div className="space-y-5">{quiz.map((q,i)=><details key={i} className="rounded-xl border border-line bg-surface p-5"><summary className="cursor-pointer font-semibold text-ink">{i+1}. {q.question}</summary><ol className="mt-4 list-[upper-alpha] space-y-1 pl-5 text-sm text-muted">{q.choices.map(c=><li key={c}>{c}</li>)}</ol><p className="mt-4 text-sm text-ink"><strong>Answer: {String.fromCharCode(65+q.correct)}.</strong> {q.why}</p></details>)}</div>
    </Step>
  </ModuleShell>;
}
