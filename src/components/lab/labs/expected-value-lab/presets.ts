// Preset payoff tables of the Expected Value Lab (hypothetical games).
import type { Outcome } from "@/lib/engine/probability";

export type Preset = "die" | "lottery" | "insurance" | "bet" | "custom";
export interface Row extends Outcome {
  label: string;
}
export interface EvParams extends Record<string, unknown> {
  preset: Preset;
  outcomes: Row[];
  draws: number;
  hideE: boolean;
  seed: number;
}
export const EV_PRESETS: Record<Exclude<Preset, "custom">, Row[]> = {
  die: [1, 2, 3, 4, 5, 6].map((x) => ({ label: String(x), x, p: 1 / 6 })),
  lottery: [
    { label: "lose", x: -500, p: 0.9 },
    { label: "small", x: 1000, p: 0.09 },
    { label: "jackpot", x: 30000, p: 0.01 },
  ],
  insurance: [
    { label: "no claim", x: -120, p: 0.97 },
    { label: "claim", x: 3880, p: 0.03 },
  ],
  bet: [
    { label: "lose", x: -10, p: 0.5 },
    { label: "win", x: 12, p: 0.5 },
  ],
};
