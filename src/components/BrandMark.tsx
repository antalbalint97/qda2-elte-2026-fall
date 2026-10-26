import { cn } from "@/lib/cn";
import Link from "next/link";

/** The QDA2 mark: an off-white tile with a teal point (design system V3). */
export function BrandGlyph({ className }: { className?: string }) {
  return (
    <span aria-hidden className={cn("grid h-[26px] w-[26px] shrink-0 place-items-center rounded-[7px] bg-ink", className)}>
      <span className="block h-2.5 w-2.5 rounded-full bg-model" />
    </span>
  );
}

/** Brand link used by the site header and the full-screen app bars (labs, lessons, builder). */
export function BrandLink({ label = "QDA2 Lab", tagline, compact, className, onClick }: { label?: string; tagline?: string; /** Show only the glyph below 2xl (crowded app bars). */ compact?: boolean; className?: string; onClick?: () => void }) {
  return (
    <Link href="/" onClick={onClick} className={cn("flex shrink-0 items-center gap-2.5 whitespace-nowrap text-ink", className)} aria-label={`${label}: home`}>
      <BrandGlyph />
      <span className={cn("text-sm font-semibold tracking-[0.06em]", compact && "hidden 2xl:inline")}>{label}</span>
      {tagline && <span className="hidden text-[13px] text-faint xl:inline">{tagline}</span>}
    </Link>
  );
}
