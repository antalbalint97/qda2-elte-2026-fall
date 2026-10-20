import { ButtonLink } from "@/components/ui/Button";
import { MODULES } from "@/content/modules";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <div className="mx-auto max-w-3xl px-4 pb-24 pt-14 sm:px-6">
      <p className="font-mono text-xs tracking-widest text-faint">404</p>
      <h1 className="mt-2 font-serif text-4xl font-semibold tracking-tight text-ink">This page does not exist</h1>
      <p className="mt-4 leading-relaxed text-muted">
        The address may be mistyped, or the page may have moved. Every module is listed below.
      </p>
      <ul className="mt-6 grid gap-1 sm:grid-cols-2">
        {MODULES.map((m) => (
          <li key={m.slug}>
            <Link href={m.href} className="flex gap-3 rounded-md px-2 py-2 text-sm text-ink hover:bg-surface-2">
              <span className="font-mono text-xs text-faint">{m.number}</span>
              {m.title}
            </Link>
          </li>
        ))}
      </ul>
      <div className="mt-8">
        <ButtonLink href="/" variant="primary">
          Go to the start page
        </ButtonLink>
      </div>
    </div>
  );
}
