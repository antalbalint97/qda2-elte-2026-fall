// Lazarsfeld & Simpson Lab model. tables[z][x] = [count Y = 1, count Y = 0]; x index 0 is X = 1 (exposed),
// index 1 is X = 0. The zero-order table is always the cell-wise sum of the partials (engine `partials`).
import { partials, type Partials } from "@/lib/engine/inference";

export type Tables = number[][][];
export type ScenarioId = "replication" | "specification" | "explanation" | "interpretation" | "simpson";
export type Pattern = ScenarioId;

interface Names {
  x: string;
  y: string;
  z: string;
  z0: string;
  z1: string;
}
export interface LzScenario {
  names: { en: Names; hu: Names };
  tables: Tables;
  /** Where the counts come from. */
  source: { en: string; hu: string };
}

const HAND = { en: "Hand-authored illustrative counts (not an empirical finding).", hu: "Kézzel írt illusztratív gyakoriságok (nem empirikus eredmény)." };

export const LZ_SCENARIOS: Record<ScenarioId, LzScenario> = {
  replication: {
    names: { en: { x: "Reads news daily", y: "Votes", z: "Education", z0: "no degree", z1: "degree" }, hu: { x: "Naponta olvas híreket", y: "Szavaz", z: "Iskolázottság", z0: "nincs diploma", z1: "diploma" } },
    tables: [
      [[60, 40], [35, 65]],
      [[62, 38], [37, 63]],
    ],
    source: HAND,
  },
  specification: {
    names: { en: { x: "Reads news daily", y: "Votes", z: "Age", z0: "under 40", z1: "40 and over" }, hu: { x: "Naponta olvas híreket", y: "Szavaz", z: "Életkor", z0: "40 alatt", z1: "40 és felett" } },
    tables: [
      [[52, 48], [48, 52]],
      [[78, 22], [36, 64]],
    ],
    source: HAND,
  },
  explanation: {
    names: { en: { x: "Owns many books", y: "High grades", z: "Parents' education", z0: "high", z1: "low" }, hu: { x: "Sok könyve van", y: "Jó jegyek", z: "Szülők iskolázottsága", z0: "magas", z1: "alacsony" } },
    tables: [
      [[140, 60], [34, 16]],
      [[15, 35], [60, 140]],
    ],
    source: HAND,
  },
  interpretation: {
    names: { en: { x: "Higher education", y: "Trusts institutions", z: "Political interest", z0: "high", z1: "low" }, hu: { x: "Felsőfokú végzettség", y: "Bízik az intézményekben", z: "Politikai érdeklődés", z0: "magas", z1: "alacsony" } },
    tables: [
      [[132, 68], [32, 18]],
      [[15, 35], [58, 142]],
    ],
    source: HAND,
  },
  // Kidney-stone treatment data: Charig et al. (1986), BMJ 292:879–882, as used by Julious & Mullee (1994),
  // BMJ 309:1480 to illustrate Simpson's paradox. X = 1: open surgery (A); X = 0: percutaneous nephrolithotomy (B).
  simpson: {
    names: { en: { x: "Treatment A (open surgery)", y: "Success", z: "Stone size", z0: "small (< 2 cm)", z1: "large (≥ 2 cm)" }, hu: { x: "A kezelés (nyílt műtét)", y: "Siker", z: "Kőméret", z0: "kicsi (< 2 cm)", z1: "nagy (≥ 2 cm)" } },
    tables: [
      [[81, 6], [234, 36]],
      [[192, 71], [55, 25]],
    ],
    source: {
      en: "Published counts: Charig et al. (1986), BMJ 292:879–882; the Simpson's-paradox reading follows Julious & Mullee (1994), BMJ 309:1480.",
      hu: "Publikált gyakoriságok: Charig és mtsai (1986), BMJ 292:879–882; a Simpson-paradoxon értelmezése Julious és Mullee (1994), BMJ 309:1480 nyomán.",
    },
  },
};

export const clone = (t: Tables): Tables => t.map((z) => z.map((r) => [...r]));

/** Pattern read from the % differences only (thresholds in percentage points, as in the prototype). */
export function classify(P: Partials): "replication" | "specification" | "explanation" | "simpson" | null {
  const d0 = P.zeroDiff;
  const ds = P.partialDiff;
  if (d0 === null || ds.some((d) => d === null)) return null;
  const [a, b] = ds as number[];
  if (Math.abs(d0) >= 3 && [a, b].every((d) => Math.sign(d) === -Math.sign(d0) && Math.abs(d) > 3)) return "simpson";
  if (Math.abs(a) < 4 && Math.abs(b) < 4 && Math.abs(d0) >= 6) return "explanation";
  if (Math.abs(a - b) > 10) return "specification";
  return "replication";
}

const pct1 = (r: readonly number[]) => (r[0] + r[1] ? r[0] / (r[0] + r[1]) : 0.5);

/**
 * Sets the share of Z = 1 within X group `xi`, keeping that group's n and both partial % Y = 1 fixed
 * (counts are rounded to integers).
 */
export function setComposition(t: Tables, xi: number, shareZ1: number): Tables {
  const out = clone(t);
  const n = t[0][xi][0] + t[0][xi][1] + t[1][xi][0] + t[1][xi][1];
  const n1 = Math.round(Math.min(1, Math.max(0, shareZ1)) * n);
  [n - n1, n1].forEach((nz, z) => {
    const y1 = Math.round(pct1(t[z][xi]) * nz);
    out[z][xi] = [y1, nz - y1];
  });
  return out;
}

/** Sets % Y = 1 in the partial cell (z, xi), keeping its n. */
export function setPartialPct(t: Tables, z: number, xi: number, pct: number): Tables {
  const out = clone(t);
  const n = t[z][xi][0] + t[z][xi][1];
  const y1 = Math.round((Math.min(100, Math.max(0, pct)) / 100) * n);
  out[z][xi] = [y1, n - y1];
  return out;
}

export { partials };
