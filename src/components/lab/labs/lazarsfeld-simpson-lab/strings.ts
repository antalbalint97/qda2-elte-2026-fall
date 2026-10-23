// EN/HU strings transcribed from the V3 prototype (QDA2 Lazarsfeld Lab.dc.html).
import type { Lang } from "@/content/curriculum/types";
import type { Pattern } from "./model";

const lz_t_en = {
  title: "Lazarsfeld & Simpson Lab",
  scenario: "Scenario",
  panels: "% Y = 1 by X: zero-order and within each level of Z",
  panelNote: "bars: % Y = 1 for X = 1 (blue) and X = 0 (grey); drag a partial bar to change it; d = the difference",
  tables: "Partial tables (editable)",
  composition: "Composition of the X groups by Z",
  compNote: "The zero-order table is the weighted sum of the partials. If the X groups differ in Z and Z relates to Y, the aggregate can differ from every partial.",
  classify: "Classify the pattern",
  dag: "Causal order of Z",
  lead: "Compare the association between X and Y before and after holding Z constant. Edit a partial table, drag a partial bar or change the composition: the zero-order percentages are recomputed, never typed. Then classify what you see and decide whether Z is antecedent or intervening.",
  note: "Identity checked on every render: the zero-order table equals the cell-wise sum of the partials. Classification uses the % differences only; the same partial pattern is 'explanation' or 'interpretation' depending on causal order, and the data cannot tell them apart.",
  formula: ["d₀ = %Y(X=1) − %Y(X=0)", "d_z = the same within Z = z", "aggregate % = Σ_z w_z · %_z,  w_z = share of the X group in Z = z"],
  insight: "Replication: d_z ≈ d₀. Specification: d_z differs across z. Explanation / interpretation: d_z ≈ 0 while d₀ ≠ 0 (spurious vs mediated). Simpson: d_z reverses the sign of d₀.",
  patterns: { replication: "Replication", specification: "Specification", explanation: "Explanation (spurious)", interpretation: "Interpretation (mediated)", simpson: "Simpson's paradox" } as Record<Pattern, string>,
  orders: { antecedent: "Z before X (antecedent)", intervening: "X → Z → Y (intervening)" },
  advice: {
    antecedent: "Antecedent Z: X ← Z → Y. Adjusting for Z is right: the partial differences are the better estimate of X's own association with Y; if they vanish, the zero-order relation was spurious.",
    intervening: "Intervening Z: X → Z → Y. Z is a mediator; conditioning on it removes exactly the path you want to measure. The zero-order difference is the total association; the partials show what remains besides the Z path.",
  },
  correct: "Correct: this is the pattern the differences show.",
  correctBoth: " (explanation or interpretation: the causal order decides).",
  wrong: "Not quite: compare the partial differences with the zero-order one.",
  hiddenPattern: "hidden until you classify",
  live: "zero-order {d0}, partials {d1} and {d2}",
  zeroOrder: "Zero-order",
  readouts: "Readouts",
  share: "share of {z} = {v}",
  restore: "Restore scenario counts",
  pattern: "pattern",
  identity: "Σ partials = zero-order",
  meanPartial: "mean partial d",
};
type LzStrings = typeof lz_t_en;

const lz_t_hu: LzStrings = {
  title: "Lazarsfeld- és Simpson-labor",
  scenario: "Forgatókönyv",
  panels: "% Y = 1 X szerint: nulladrendű és Z szintjein belül",
  panelNote: "oszlopok: % Y = 1 X = 1-re (kék) és X = 0-ra (szürke); a parciális oszlop húzható; d = a különbség",
  tables: "Parciális táblák (szerkeszthető)",
  composition: "Az X-csoportok összetétele Z szerint",
  compNote: "A nulladrendű tábla a parciálisok súlyozott összege. Ha az X-csoportok Z-ben eltérnek és Z kapcsolódik Y-hoz, az aggregátum minden parciálistól eltérhet.",
  classify: "Osztályozd a mintázatot",
  dag: "Z oksági helye",
  lead: "Hasonlítsd össze X és Y kapcsolatát Z rögzítése előtt és után. Szerkessz egy parciális táblát, húzz egy parciális oszlopot vagy változtasd az összetételt: a nulladrendű százalékokat mindig újraszámoljuk. Majd osztályozd a látottat, és döntsd el, Z megelőző vagy közbülső.",
  note: "Minden rendernél ellenőrzött azonosság: a nulladrendű tábla a parciálisok cellánkénti összege. Az osztályozás csak a %-különbségeket használja; ugyanaz a parciális mintázat 'magyarázat' vagy 'interpretáció' az oksági sorrendtől függően, és ezt az adat nem dönti el.",
  formula: lz_t_en.formula,
  insight: "Replikáció: d_z ≈ d₀. Specifikáció: d_z eltér z-k között. Magyarázat / interpretáció: d_z ≈ 0, míg d₀ ≠ 0 (látszólagos vs. közvetített). Simpson: d_z előjele ellentétes d₀-éval.",
  patterns: { replication: "Replikáció", specification: "Specifikáció", explanation: "Magyarázat (látszólagos)", interpretation: "Interpretáció (közvetített)", simpson: "Simpson-paradoxon" },
  orders: { antecedent: "Z X előtt (megelőző)", intervening: "X → Z → Y (közbülső)" },
  advice: {
    antecedent: "Megelőző Z: X ← Z → Y. Z-re kontrollálni helyes: a parciális különbségek jobban becslik X saját kapcsolatát Y-nal; ha eltűnnek, a nulladrendű kapcsolat látszólagos volt.",
    intervening: "Közbülső Z: X → Z → Y. Z mediátor; a rá való kontroll épp a mérni kívánt utat távolítja el. A nulladrendű különbség a teljes kapcsolat; a parciálisok azt mutatják, ami a Z-úton kívül marad.",
  },
  correct: "Helyes: ezt a mintázatot mutatják a különbségek.",
  correctBoth: " (magyarázat vagy interpretáció: az oksági sorrend dönt).",
  wrong: "Nem egészen: hasonlítsd a parciális különbségeket a nulladrendűvel.",
  hiddenPattern: "rejtve, amíg nem osztályozol",
  live: "nulladrendű {d0}, parciálisok {d1} és {d2}",
  zeroOrder: "Nulladrendű",
  readouts: "Kiolvasások",
  share: "{z} aránya = {v}",
  restore: "A forgatókönyv adatainak visszaállítása",
  pattern: "mintázat",
  identity: "Σ parciális = nulladrendű",
  meanPartial: "parciális d átlaga",
};

export const LZ_T: Record<Lang, LzStrings> = { en: lz_t_en, hu: lz_t_hu };
