import { LocalDataControls } from "@/components/privacy/LocalDataControls";
import { Callout } from "@/components/ui/Callout";
import { SITE } from "@/content/site";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Privacy & local data",
  description: "What StatisztikaMetis stores in your browser, what the hosting provider processes, and how to delete local data.",
};

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="text-2xl font-semibold tracking-tight text-ink">{title}</h2>
      <div className="mt-3 space-y-3 leading-relaxed text-muted [&_strong]:text-ink">{children}</div>
    </section>
  );
}

export default function Page() {
  return (
    <div className="mx-auto max-w-3xl px-4 pb-24 pt-10 sm:px-6 sm:pt-14">
      <p className="font-mono text-xs tracking-widest text-faint">PRIVACY & LOCAL DATA</p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
        How this site handles data
      </h1>
      <p className="mt-4 text-lg leading-relaxed text-muted">
        A plain description of what happens when you use {SITE.name}. It is based on an inspection of the site&apos;s
        code and its network behaviour, and it separates data kept in your own browser from ordinary web-hosting logs.
      </p>

      <Callout tone="key" title="In short" className="mt-8">
        <ul className="list-disc space-y-1 pl-5">
          <li>There are no accounts, no sign-in and no student profiles.</li>
          <li>Your quiz answers and notes are saved only in this browser. The site does not send them anywhere.</li>
          <li>The site sets no cookies and loads no analytics, advertising or tracking scripts.</li>
          <li>
            Like every website, the hosting provider receives technical request data (such as your IP address) when it
            delivers the pages.
          </li>
        </ul>
      </Callout>

      <div className="mt-12 space-y-12">
        <Section id="local" title="1. Data saved in your browser">
          <p>
            To remember your progress between visits, the site uses your browser&apos;s <strong>localStorage</strong>.
            This data stays on your device. It is not transmitted to the site, its developer or anyone else, and it is
            not shared between devices or browsers.
          </p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              <strong>Learning progress</strong>: for each quiz question you answer, its identifier, the topic, whether
              your first attempt was correct, how many attempts you made and when you first answered it; your current
              and best answer streak; your own &ldquo;review / OK&rdquo; ratings of topics; which optional advanced
              topics you marked as explored.
            </li>
            <li>
              <strong>Notes</strong> you type into the write-up boxes of the Sopranos bonus lab. These contain whatever
              you write, so avoid entering personal information there, especially on a shared computer.
            </li>
            <li>
              <strong>Display settings</strong>: light or dark theme, and whether presentation mode is on.
            </li>
          </ul>
          <p>
            Anyone using the same browser profile can see this progress. On a shared or classroom computer, delete it
            when you finish (below), or use a private window, where it is discarded when the window closes.
          </p>
        </Section>

        <section aria-labelledby="controls-heading" className="space-y-3">
          <h2 id="controls-heading" className="text-2xl font-semibold tracking-tight text-ink">
            2. See and delete your local data
          </h2>
          <LocalDataControls />
          <p className="text-sm leading-relaxed text-muted">
            You can also clear it through your browser&apos;s settings (site data for this address). Progress can be
            reset from the <Link href="/review" className="text-accent underline underline-offset-2 hover:no-underline">Quick review</Link> page too.
          </p>
        </section>

        <Section id="network" title="3. What leaves your browser">
          <p>
            Your browser downloads the site&apos;s pages, scripts, styles and fonts from this site&apos;s own address.
            Fonts and mathematical notation are served from the same address; no external content networks, font
            services or third-party scripts are used. Moving between pages fetches further page content from the same
            address. None of these requests contain your answers, notes or progress.
          </p>
          <p>
            The &ldquo;Explain why my answer was wrong&rdquo; button is a <strong>preview</strong>: it builds its
            explanation inside your browser and does not contact any AI service. The &ldquo;Copy link&rdquo; button in
            the bonus lab only writes a link to your clipboard when you press it.
          </p>
          <p>
            <strong>Browser R</strong> (the <Link href="/r" className="text-accent underline underline-offset-2 hover:no-underline">R in the browser</Link>{" "}
            page and R blocks in course lessons) runs R inside your browser tab. The R runtime is downloaded from this
            site&apos;s own address the first time you press Run. The code you type and its output stay in the tab and
            are not saved or sent. Only if you ask for the <strong>survey</strong> package does your browser download
            it from the webR package repository (repo.r-wasm.org, run by the webR project); that server then receives an
            ordinary download request from your browser, including your IP address, but not your code or data.
          </p>
        </Section>

        <Section id="hosting" title="4. Hosting and request logs">
          <p>
            The site is hosted by <strong>{SITE.host.name}</strong>. As with any website, delivering a page means the
            hosting infrastructure processes technical request data: for example your IP address, the address
            requested, the time, and your browser&apos;s user-agent string. Such data is typically used for delivery,
            security and abuse prevention and may appear in the provider&apos;s logs. The site&apos;s code does not add
            any information about you to these requests.
          </p>
          <p>
            How long the provider keeps such data, and on what basis, is governed by the provider&apos;s own terms; see{" "}
            <a href={SITE.host.privacyUrl} className="text-accent underline underline-offset-2 hover:no-underline" rel="noopener noreferrer">
              {SITE.host.name}&apos;s privacy policy
            </a>
            . Your own network (for example a university or employer network) may also log the sites you visit.
          </p>
        </Section>

        <Section id="cookies" title="5. Cookies and tracking">
          <p>
            The site&apos;s code sets no cookies and uses no analytics, advertising, fingerprinting or social-media
            tracking. Because nothing is used for tracking, there is no cookie banner. If this ever changes, this page
            will be updated first.
          </p>
        </Section>

        <Section id="personal" title="6. Personal information">
          <p>
            The site does not ask for your name, e-mail address, student number or any other identifying information,
            and it does not need any to work. The only place you can type free text is the notes in the bonus lab,
            which stay in your browser.
          </p>
          <p>
            This page describes the technical behaviour of the site. It is not a legal assessment, and it does not
            claim that using the site involves no processing of personal data at all: request data handled by the
            hosting provider can count as personal data.
          </p>
        </Section>

        <Section id="contact" title="7. Questions">
          {SITE.contact ? (
            <p>
              Questions about this site and its data handling: <strong>{SITE.contact}</strong>.
            </p>
          ) : (
            <p>
              A contact address for questions about this site has not been published yet. Your local data can be
              deleted at any time with the controls above, without contacting anyone.
            </p>
          )}
          <p className="text-sm">Last reviewed: {SITE.lastReviewed}.</p>
        </Section>
      </div>
    </div>
  );
}
