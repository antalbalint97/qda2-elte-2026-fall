"use client";

import { useId, type ReactNode } from "react";

export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  display,
  hint,
  valueText,
  disabled = false,
}: {
  label: ReactNode;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  display?: ReactNode;
  hint?: ReactNode;
  valueText?: string;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium text-ink">
          {label}
        </label>
        <span className="font-mono text-sm tabular-nums text-ink">{display ?? value}</span>
      </div>
      <input
        id={id}
        type="range"
        className="range disabled:cursor-not-allowed disabled:opacity-50"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-valuetext={valueText}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      {hint && <p className="text-xs text-faint">{hint}</p>}
    </div>
  );
}
