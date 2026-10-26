"use client";

import { Button, ButtonLink } from "@/components/ui/Button";

/** Shown instead of a blank page if an interactive part of a page fails while running. */
export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div role="alert" className="mx-auto max-w-3xl px-4 pb-24 pt-14 sm:px-6">
      <p className="font-mono text-xs tracking-widest text-faint">SOMETHING WENT WRONG</p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight text-ink">This page could not be displayed</h1>
      <p className="mt-4 leading-relaxed text-muted">
        An interactive element stopped working in this browser. Your saved progress is not affected. Try again, or
        reload the page. If the problem persists, try another up-to-date browser.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Button variant="primary" onClick={reset}>
          Try again
        </Button>
        <ButtonLink href="/">Go to the start page</ButtonLink>
      </div>
    </div>
  );
}
