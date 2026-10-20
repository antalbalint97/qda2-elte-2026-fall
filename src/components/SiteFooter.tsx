import Link from "next/link";

const LINKS = [
  { href: "/about", label: "About" },
  { href: "/privacy", label: "Privacy & local data" },
  { href: "/review", label: "Quick review" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-line py-8 text-xs text-faint">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 sm:flex-row sm:items-start sm:justify-between sm:px-6">
        <div className="max-w-2xl space-y-1 leading-relaxed">
          <p>
            <span className="font-medium text-muted">StatisztikaMetis · QDA2 Interactive Lab</span> · a study companion
            for Quantitative Data Analysis 2 · progress is stored only in this browser
          </p>
          <p>
            StatisztikaMetis is an independently developed educational resource. References to university courses or
            institutions do not imply official institutional endorsement.
          </p>
        </div>
        <nav aria-label="Site information">
          <ul className="flex flex-wrap gap-x-4 gap-y-1">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="font-medium text-muted underline-offset-2 hover:text-ink hover:underline">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
