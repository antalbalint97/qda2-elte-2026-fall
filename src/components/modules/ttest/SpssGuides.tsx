"use client";

import { BeforeSpss, MenuPath, SpssDialog, SpssOutput } from "@/components/learning/Spss";
import { Segmented } from "@/components/ui/Segmented";
import { Role } from "@/components/ui/Role";
import { useState } from "react";

export function SpssGuides() {
  const [tab, setTab] = useState<"one" | "ind" | "paired">("one");
  return (
    <div className="space-y-6">
      <Segmented
        label="t-test type"
        value={tab}
        onChange={setTab}
        options={[
          { value: "one", label: "One-sample" },
          { value: "ind", label: "Independent" },
          { value: "paired", label: "Paired" },
        ]}
      />
      <div key={tab} className="animate-fade-up space-y-6">
        {tab === "one" && (
          <>
            <BeforeSpss
              items={[
                { q: "What is the research question?", a: "Is the average interview completion time equal to 60 minutes?" },
                { q: "What is Y?", a: <Role r="Y">interview length (minutes)</Role> },
                { q: "Measurement level?", a: "Scale, so a mean makes sense." },
                { q: "What are we comparing?", a: "One sample mean with a fixed value (60)." },
                { q: "Which method?", a: "One-sample t-test, H₀: μ = 60." },
              ]}
            />
            <MenuPath path={["Analyze", "Compare Means", "One-Sample T Test"]} />
            <SpssDialog
              title="One-Sample T Test"
              variables={["respid", "interviewer", "mode", "region"]}
              fields={[
                { label: "Test Variable(s):", values: ["intlength"], note: "The scale variable whose mean you test." },
                { label: "Test Value:", values: ["60"], note: "The value stated in H₀. SPSS's default is 0, which is almost never what you want." },
              ]}
            />
            <SpssOutput
              title="One-Sample Test (Test Value = 60)"
              headers={["", "t", "df", "Sig. (2-tailed)", "Mean Difference", "95% CI Lower", "95% CI Upper"]}
              rows={[["intlength", { v: "3.12", hl: 1 }, "199", { v: ".002", hl: 2 }, { v: "2.84", hl: 3 }, "1.04", "4.64"]]}
              annotations={{
                1: "t = mean difference / standard error.",
                2: "p < .05: reject H₀: μ = 60.",
                3: "Interviews last on average 2.84 minutes longer than 60. Is that substantively important?",
              }}
            />
          </>
        )}
        {tab === "ind" && (
          <>
            <BeforeSpss
              items={[
                { q: "What is the research question?", a: "Do politically interested and uninterested respondents differ in happiness?" },
                { q: "What are X and Y?", a: <><Role r="X">political interest (2 groups)</Role> <Role r="Y">happiness 0–10</Role></> },
                { q: "Measurement levels?", a: "X: categorical with two groups; Y: scale (by convention)." },
                { q: "What are we comparing?", a: "Means of two independent groups." },
                { q: "Which method?", a: "Independent-samples t-test, H₀: μ₁ = μ₂." },
              ]}
            />
            <MenuPath path={["Analyze", "Compare Means", "Independent-Samples T Test"]} />
            <SpssDialog
              title="Independent-Samples T Test"
              variables={["gender", "agey", "educ", "trustprl"]}
              fields={[
                { label: "Test Variable(s):", values: ["happy"], note: "The dependent variable (scale) whose means you compare: Y." },
                {
                  label: "Grouping Variable:",
                  values: ["polint2(1 2)"],
                  note: "The variable defining the two groups: X.",
                  extra: <span className="mt-1 inline-block rounded border border-line px-1.5 py-0.5 text-[10px] text-muted">Define Groups…</span>,
                },
                { label: "Define Groups:", values: ["Group 1: 1", "Group 2: 2"], note: "Enter the codes of the two groups. If X has more categories, choose two of them (or use a cut point)." },
              ]}
            />
            <p className="text-sm text-muted">
              The output shows Levene&apos;s test and two rows of t-test results. See the next section for which row to
              read.
            </p>
          </>
        )}
        {tab === "paired" && (
          <>
            <BeforeSpss
              items={[
                { q: "What is the research question?", a: "Do respondents rate education and healthcare differently?" },
                { q: "What is compared?", a: <>Two variables from the same respondents: <Role r="Y">rating of education</Role> and <Role r="Y">rating of healthcare</Role></> },
                { q: "Measurement levels?", a: "Both 0–10, treated as scale." },
                { q: "What are we comparing?", a: "Two measurements per person: test the mean of the differences." },
                { q: "Which method?", a: "Paired-samples t-test, H₀: μ_d = 0." },
              ]}
            />
            <MenuPath path={["Analyze", "Compare Means", "Paired-Samples T Test"]} />
            <SpssDialog
              title="Paired-Samples T Test"
              variables={["gender", "agey", "stfeco", "stfgov"]}
              fields={[
                {
                  label: "Paired Variables (Pair 1):",
                  values: ["Variable1: stfedu", "Variable2: stfhlth"],
                  note: "Put the two measurements in the same row. SPSS computes Variable1 − Variable2 for every respondent.",
                },
              ]}
            />
            <SpssOutput
              title="Paired Samples Test"
              headers={["", "Mean", "Std. Deviation", "t", "df", "Sig. (2-tailed)"]}
              rows={[["Pair 1  stfedu − stfhlth", { v: "0.42", hl: 1 }, "2.10", "6.48", "1049", { v: ".000", hl: 2 }]]}
              annotations={{
                1: "The mean within-person difference: education is rated 0.42 points higher on average.",
                2: "p < .001: reject H₀: μ_d = 0.",
              }}
            />
          </>
        )}
      </div>
    </div>
  );
}
