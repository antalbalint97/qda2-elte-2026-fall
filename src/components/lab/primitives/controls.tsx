"use client";

// Lab controls. Every control can be bound to a parameter key; when the instructor locked that key the
// control is disabled and says so (the value is still shown).
import { cn } from "@/lib/cn";
import { useId, useRef, type ReactNode } from "react";
import { useLabContext } from "../shell/LabShell";

function LockNote({ show }: { show: boolean }) {
  const { t } = useLabContext();
  if (!show) return null;
  return (
    <span className="ml-1 inline-flex items-center gap-1 text-[11px] font-normal text-warn">
      <svg aria-hidden viewBox="0 0 16 16" className="h-3 w-3">
        <path d="M5 7V5a3 3 0 0 1 6 0v2M4 7h8v6H4z" fill="none" stroke="currentColor" strokeWidth="1.5" />
      </svg>
      {t.locked}
    </span>
  );
}

/** Slider plus a number field (the non-drag alternative), clamped to [min, max] and snapped to step. */
export function ParameterControl({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  param,
  format,
  hint,
  disabled,
  unit,
}: {
  label: ReactNode;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  /** Parameter key for instructor locks. */
  param?: string;
  format?: (v: number) => string;
  hint?: ReactNode;
  disabled?: boolean;
  unit?: string;
}) {
  const id = useId();
  const { locked } = useLabContext();
  const isLocked = !!param && locked(param);
  const off = disabled || isLocked;
  const decimals = (String(step).split(".")[1] ?? "").length;
  const commit = (raw: number) => {
    if (!Number.isFinite(raw)) return;
    const snapped = Math.round((raw - min) / step) * step + min;
    onChange(Math.min(max, Math.max(min, +snapped.toFixed(decimals))));
  };
  const shown = format ? format(value) : value.toFixed(decimals);
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-sm font-medium text-ink">
          {label}
          <LockNote show={isLocked} />
        </label>
        <input
          type="number"
          aria-label={typeof label === "string" ? `${label} (number)` : undefined}
          className="w-20 rounded-md border border-line bg-surface px-1.5 py-0.5 text-right font-mono text-sm tabular-nums text-ink disabled:opacity-60"
          value={Number.isFinite(value) ? +value.toFixed(decimals) : ""}
          min={min}
          max={max}
          step={step}
          disabled={off}
          onChange={(e) => e.target.value !== "" && commit(Number(e.target.value))}
        />
      </div>
      <input
        id={id}
        type="range"
        className="range disabled:cursor-not-allowed disabled:opacity-50"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={off}
        aria-valuetext={unit ? `${shown} ${unit}` : shown}
        onChange={(e) => commit(Number(e.target.value))}
      />
      {hint && <p className="text-xs text-faint">{hint}</p>}
    </div>
  );
}

export interface ChoiceOption<T extends string | number> {
  value: T;
  label: ReactNode;
}

/** Radiogroup with arrow-key navigation (segmented look). */
export function ChoiceControl<T extends string | number>({
  label,
  options,
  value,
  onChange,
  param,
  size = "sm",
  hideLabel = false,
  className,
}: {
  label: string;
  options: ChoiceOption<T>[];
  value: T;
  onChange: (v: T) => void;
  param?: string;
  size?: "sm" | "md";
  hideLabel?: boolean;
  className?: string;
}) {
  const { locked } = useLabContext();
  const isLocked = !!param && locked(param);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const idx = options.findIndex((o) => o.value === value);
  const labelId = useId();
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (isLocked) return;
    let next = -1;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (idx + 1) % options.length;
    if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (idx - 1 + options.length) % options.length;
    if (next >= 0) {
      e.preventDefault();
      onChange(options[next].value);
      refs.current[next]?.focus();
    }
  };
  return (
    <div className={cn("space-y-1", className)}>
      {!hideLabel && (
        <p id={labelId} className="text-sm font-medium text-ink">
          {label}
          <LockNote show={isLocked} />
        </p>
      )}
      <div
        role="radiogroup"
        aria-labelledby={hideLabel ? undefined : labelId}
        aria-label={hideLabel ? label : undefined}
        aria-disabled={isLocked || undefined}
        onKeyDown={onKeyDown}
        className="inline-flex flex-wrap rounded-lg border border-line bg-surface-2 p-0.5"
      >
        {options.map((o, i) => {
          const active = o.value === value;
          return (
            <button
              key={String(o.value)}
              ref={(el) => {
                refs.current[i] = el;
              }}
              type="button"
              role="radio"
              aria-checked={active}
              tabIndex={active || (idx < 0 && i === 0) ? 0 : -1}
              disabled={isLocked && !active}
              onClick={() => !isLocked && onChange(o.value)}
              className={cn(
                "rounded-md font-medium transition",
                size === "sm" ? "px-2.5 py-1 text-xs" : "px-3.5 py-1.5 text-sm",
                active ? "bg-surface text-ink shadow-sm ring-1 ring-line" : "text-muted hover:text-ink disabled:opacity-50",
              )}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Native select (for long option lists). */
export function SelectControl<T extends string>({
  label,
  options,
  value,
  onChange,
  param,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  param?: string;
}) {
  const id = useId();
  const { locked } = useLabContext();
  const isLocked = !!param && locked(param);
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium text-ink">
        {label}
        <LockNote show={isLocked} />
      </label>
      <select
        id={id}
        value={value}
        disabled={isLocked}
        onChange={(e) => onChange(e.target.value as T)}
        className="w-full rounded-lg border border-line bg-surface px-2 py-1.5 text-sm text-ink disabled:opacity-60"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

/** Switch-style checkbox. */
export function ToggleControl({
  label,
  checked,
  onChange,
  param,
  hint,
  disabled,
}: {
  label: ReactNode;
  checked: boolean;
  onChange: (v: boolean) => void;
  param?: string;
  hint?: ReactNode;
  disabled?: boolean;
}) {
  const id = useId();
  const { locked } = useLabContext();
  const isLocked = !!param && locked(param);
  return (
    <div>
      <label htmlFor={id} className="flex cursor-pointer items-center gap-2 text-sm text-ink">
        <input
          id={id}
          type="checkbox"
          className="h-4 w-4 accent-[var(--accent)]"
          checked={checked}
          disabled={isLocked || disabled}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span>
          {label}
          <LockNote show={isLocked} />
        </span>
      </label>
      {hint && <p className="ml-6 text-xs text-faint">{hint}</p>}
    </div>
  );
}

/** Small secondary button used inside panels. */
export function LabButton({
  children,
  onClick,
  pressed,
  disabled,
  variant = "secondary",
  className,
  title,
}: {
  children: ReactNode;
  onClick: () => void;
  pressed?: boolean;
  disabled?: boolean;
  variant?: "primary" | "secondary";
  className?: string;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={pressed}
      disabled={disabled}
      title={title}
      className={cn(
        "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-40",
        variant === "primary"
          ? "bg-accent text-accent-ink hover:opacity-90"
          : pressed
            ? "border border-ink bg-surface-2 text-ink"
            : "border border-line bg-surface text-ink hover:border-line-strong hover:bg-surface-2",
        className,
      )}
    >
      {children}
    </button>
  );
}

/** Seed field + "new seed" button. Seeds are integers in [1, 2^31). */
export function SeedControl({ value, onChange, param = "seed" }: { value: number; onChange: (v: number) => void; param?: string }) {
  const id = useId();
  const { t, locked } = useLabContext();
  const isLocked = locked(param);
  return (
    <div className="flex items-center gap-2">
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {t.seed}
      </label>
      <input
        id={id}
        type="number"
        min={1}
        max={2147483646}
        step={1}
        value={value}
        disabled={isLocked}
        onChange={(e) => {
          const v = Math.trunc(Number(e.target.value));
          if (Number.isFinite(v) && v >= 1 && v < 2147483647) onChange(v);
        }}
        className="w-28 rounded-md border border-line bg-surface px-1.5 py-0.5 font-mono text-sm tabular-nums text-ink disabled:opacity-60"
      />
      <LabButton onClick={() => onChange(1 + Math.floor(Math.random() * 2147483646))} disabled={isLocked} title={t.newSeed}>
        ↻
        <span className="sr-only">{t.newSeed}</span>
      </LabButton>
      <LockNote show={isLocked} />
    </div>
  );
}
