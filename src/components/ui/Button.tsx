import { cn } from "@/lib/cn";
import Link from "next/link";
import type { ComponentProps } from "react";

type Variant = "primary" | "secondary" | "ghost";

const base =
  "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 disabled:pointer-events-none select-none";
const sizes = { sm: "h-8 px-3", md: "h-10 px-4" };
const variants: Record<Variant, string> = {
  primary: "bg-accent text-accent-ink hover:opacity-90 shadow-sm",
  secondary: "bg-surface text-ink border border-line hover:border-line-strong hover:bg-surface-2",
  ghost: "text-muted hover:text-ink hover:bg-surface-2",
};

export function buttonClass(variant: Variant = "secondary", size: "sm" | "md" = "md", extra?: string) {
  return cn(base, sizes[size], variants[variant], extra);
}

export function Button({
  variant = "secondary",
  size = "md",
  className,
  ...props
}: ComponentProps<"button"> & { variant?: Variant; size?: "sm" | "md" }) {
  return <button type="button" className={buttonClass(variant, size, className)} {...props} />;
}

export function ButtonLink({
  variant = "secondary",
  size = "md",
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant; size?: "sm" | "md" }) {
  return <Link className={buttonClass(variant, size, className)} {...props} />;
}
