import { ModuleShell, Panel, Step } from "@/components/learning/ModuleShell";
import { BeforeSpss, MenuPath, SpssOutput } from "@/components/learning/Spss";
import { ClassifyExercise } from "@/components/modules/measurement/ClassifyExercise";
import { LevelsVisual } from "@/components/modules/measurement/LevelsVisual";
import { RoleDemo } from "@/components/modules/measurement/RoleDemo";
import { RoleExercise } from "@/components/modules/measurement/RoleExercise";
import { QuizRunner } from "@/components/quiz/QuizRunner";
import { Callout } from "@/components/ui/Callout";
import { Role } from "@/components/ui/Role";
import { MODULES } from "@/content/modules";
import { qAgeRole, qChildren, qLevelVsRole, qPolInterest } from "@/content/questions";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Measurement Levels" };
const meta = MODULES[0];

export default function Page() {
  return (
    <ModuleShell
      meta={meta}
      lede={
        <>
          Two questions decide almost every method choice: <em>what kind of variable is this?</em> and{" "}
          <em>what role does it play in my research question?</em> They are different questions.
        </>
      }
    >
      <Step
        kind="understand"
        id="understand"
        title="Three levels, two yes/no questions"
        intro="Ask two things about a variable's values: can they be ordered, and is the numerical distance between them meaningful? The answers give the measurement level, and the level limits which statistics make sense."
      >
        <LevelsVisual />
        <Callout tone="warn" className="mt-6" title="Numbers in the data file are not automatically numeric">
          SPSS stores almost everything as numbers. Gender might be coded 1 and 2, political interest 1 to 4. The codes
          tell you nothing about the measurement level; the meaning of the categories does.
        </Callout>
      </Step>

      <Step
        kind="try"
        id="try"
        title="Classify the variables"
        intro="Pick a level for each variable. The feedback tells you whether an order exists and whether distances are meaningful."
      >
        <ClassifyExercise />
      </Step>

      <Step
        kind="understand"
        id="roles"
        title="Measurement level is not variable role"
        intro={
          <>
            The role of a variable comes from the research question: <Role r="X">independent</Role>,{" "}
            <Role r="Y">dependent</Role> or <Role r="Z">control</Role>. The measurement level comes from how the
            variable was measured. Change the question and the role changes; the level does not.
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Panel className="bg-surface-2">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-faint">Measurement level</p>
            <p className="mt-2 text-ink">A property of the variable.</p>
            <p className="mt-1 text-sm text-muted">Nominal, ordinal or scale. Fixed once the variable is measured.</p>
          </Panel>
          <Panel className="bg-surface-2">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-faint">Variable role</p>
            <p className="mt-2 text-ink">A property of the research design.</p>
            <p className="mt-1 text-sm text-muted">X, Y or Z. It changes with the research question.</p>
          </Panel>
        </div>
        <blockquote className="my-8 border-l-2 border-accent pl-5 font-serif text-xl leading-relaxed text-ink">
          Age can be an independent variable in one research question and a control variable in another. Its role
          depends on the research design. Its measurement level does not.
        </blockquote>
        <RoleDemo />
        <div className="mt-10">
          <h3 className="mb-3 font-semibold text-ink">Your turn: what is the role of education?</h3>
          <RoleExercise />
        </div>
      </Step>

      <Step
        kind="spss"
        id="spss"
        title="Where SPSS records the measurement level"
        intro="Before any analysis, check Variable View: the Measure column, the value labels and the missing-value codes."
      >
        <div className="space-y-6">
          <BeforeSpss
            items={[
              { q: "What is the research question?", a: "Which variables will I analyse, and how?" },
              { q: "What are X and Y?", a: "Decide the roles from the question, not from the data file." },
              { q: "What are their measurement levels?", a: "Check the categories' meaning, not the codes." },
              { q: "Which codes are not valid answers?", a: "Don't know, refused, not applicable → define as missing." },
            ]}
          />
          <MenuPath path={["Data Editor", "Variable View", "Measure column"]} />
          <SpssOutput
            title="Variable View (excerpt)"
            headers={["Name", "Label", "Values", "Missing", "Measure"]}
            rows={[
              ["gender", { v: "Gender", align: "left" }, { v: "{1, man}…", align: "left" }, "None", { v: "Nominal", hl: 1 }],
              ["polint", { v: "Political interest", align: "left" }, { v: "{1, not at all}…", align: "left" }, { v: "8, 9", hl: 2 }, { v: "Ordinal", hl: 1 }],
              ["agey", { v: "Age in years", align: "left" }, { v: "None", align: "left" }, "999", { v: "Scale", hl: 1 }],
              ["trustprl", { v: "Trust in parliament", align: "left" }, { v: "{0, no trust}…", align: "left" }, { v: "88, 99", hl: 2 }, { v: "Scale", hl: 1 }],
            ]}
            annotations={{
              1: "Measure is metadata you set. It does not change the data, but it should match the real measurement level.",
              2: "Nonresponse codes (don't know, refused) must be declared as missing, or they will be treated as real answers.",
            }}
          />
        </div>
      </Step>

      <Step kind="test" id="test" title="Mastery check">
        <QuizRunner questions={[qPolInterest, qChildren, qLevelVsRole, qAgeRole]} />
      </Step>
    </ModuleShell>
  );
}
