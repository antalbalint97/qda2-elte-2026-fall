import { ModuleGlyph } from "@/components/home/ModuleGlyph";
import { ReviewChecklist } from "@/components/home/ReviewChecklist";
import { ChainBar } from "@/components/learning/ChainBar";
import { ButtonLink } from "@/components/ui/Button";
import { CHAIN, MODULES } from "@/content/modules";
import Link from "next/link";

export default function Home() {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <section className="grid gap-10 pb-16 pt-14 sm:pt-20 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-center">
        <div>
          <p className="font-mono text-xs tracking-widest text-faint">QUANTITATIVE DATA ANALYSIS 2</p>
          <h1 className="mt-3 font-serif text-5xl font-semibold tracking-tight text-ink sm:text-6xl">
            QDA2 Interactive Lab
          </h1>
          <p className="mt-5 font-serif text-2xl leading-snug text-ink/80 sm:text-[1.7rem]">
            Understand the logic.
            <br />
            Practice the decisions.
            <br />
            Read the output.
          </p>
          <p className="mt-6 max-w-xl leading-relaxed text-muted">
            An interactive companion for Quantitative Data Analysis 2. Review concepts, explore statistical intuition,
            practice SPSS decisions, and test your understanding.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/review" variant="primary">
              Start quick review
            </ButtonLink>
            <ButtonLink href="#modules">Choose a topic</ButtonLink>
          </div>
        </div>
        <ChainFigure />
      </section>

      <section id="review" className="scroll-mt-20 border-t border-line py-14">
        <div className="mb-6 flex flex-col gap-1">
          <h2 className="font-serif text-3xl font-semibold tracking-tight text-ink">What should I review?</h2>
          <p className="text-muted">Click a topic to jump straight to it.</p>
        </div>
        <ReviewChecklist />
      </section>

      <section id="modules" className="scroll-mt-20 border-t border-line py-14">
        <div className="mb-8 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
          <div>
            <h2 className="font-serif text-3xl font-semibold tracking-tight text-ink">Modules</h2>
            <p className="mt-1 text-muted">Each module follows the same rhythm: Understand → Try → SPSS → Test yourself.</p>
          </div>
        </div>
        <ol className="divide-y divide-line border-y border-line">
          {MODULES.map((m) => (
            <li key={m.slug}>
              <Link
                href={m.href}
                className="group grid gap-3 py-5 transition-colors sm:grid-cols-[3rem_4rem_minmax(0,1fr)_auto] sm:items-center sm:gap-6"
              >
                <span className="hidden font-mono text-sm text-faint sm:block">{m.number}</span>
                <span className="hidden sm:block">
                  <ModuleGlyph slug={m.slug} />
                </span>
                <span>
                  <span className="flex items-baseline gap-3">
                    <span className="font-mono text-sm text-faint sm:hidden">{m.number}</span>
                    <span className="font-serif text-xl font-semibold text-ink group-hover:text-accent">{m.title}</span>
                  </span>
                  <span className="mt-1 block text-sm leading-relaxed text-muted">{m.blurb}</span>
                </span>
                <span className="hidden max-w-[16rem] flex-wrap justify-end gap-1 md:flex">
                  {m.chain.map((c) => (
                    <span key={c} className="rounded bg-surface-2 px-1.5 py-0.5 text-[11px] text-muted">
                      {CHAIN[c]}
                    </span>
                  ))}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-t border-line py-14">
        <div className="grid gap-8 rounded-2xl bg-surface-2 p-6 sm:p-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div>
            <h2 className="font-serif text-2xl font-semibold text-ink">Quick review mode</h2>
            <p className="mt-2 max-w-2xl leading-relaxed text-muted">
              Thirty mixed questions across all six modules: classify variables, choose percentages, read SPSS output,
              name Lazarsfeld patterns, interpret r and p, choose the right t-test. Every wrong answer tells you exactly
              which idea got mixed up.
            </p>
          </div>
          <ButtonLink href="/review" variant="primary">
            Start quick review
          </ButtonLink>
        </div>
      </section>
    </div>
  );
}

function ChainFigure() {
  return (
    <figure className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
      <figcaption className="text-xs font-semibold uppercase tracking-[0.12em] text-faint">
        The chain every module reinforces
      </figcaption>
      <ol className="mt-4 space-y-1.5">
        {CHAIN.map((c, i) => (
          <li key={c} className="flex items-center gap-3">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-line font-mono text-[11px] text-muted">
              {i + 1}
            </span>
            <span
              className={
                i === CHAIN.length - 1
                  ? "rounded-md bg-accent-soft px-2 py-0.5 text-sm font-semibold text-accent"
                  : "text-sm text-ink"
              }
            >
              {c}
            </span>
          </li>
        ))}
      </ol>
      <div className="mt-5 border-t border-line pt-4">
        <p className="text-xs leading-relaxed text-muted">
          Statistics is not a sequence of software buttons. The question decides the structure, the structure decides
          the method, and only then does SPSS come in.
        </p>
      </div>
      <div className="sr-only">
        <ChainBar />
      </div>
    </figure>
  );
}
