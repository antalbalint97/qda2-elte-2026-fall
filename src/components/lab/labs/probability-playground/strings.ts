// EN/HU strings transcribed from the V3 prototype (QDA2 Probability Playground.dc.html).
import type { Lang } from "@/content/curriculum/types";

const pp_t_en = {
  "title": "Probability Playground",
  "mode": "View",
  "area": "Area model (eikosogram)",
  "tree": "Natural frequencies",
  "grid": "Two dice",
  "areaNote": "width = P(B) · heights = P(A | B), P(A | ¬B) · shaded = A",
  "treeNote": "1 000 people, rounded; the posterior is a ratio of two boxes",
  "gridNote": "click cells to define an event on the 36 equally likely outcomes",
  "sim": "Simulation",
  "scenario": "Scenario",
  "lead": {
    "area": "The unit square is everything that can happen. Drag the vertical line to change how common B is; drag the horizontal lines to change how often A happens with and without B. P(B | A) is the share of the dark-blue area within all shaded area.",
    "tree": "The same numbers as whole people. Out of 1 000, how many have B? Of those, how many show A? Bayes' theorem is just: among everyone with A, what fraction also has B?",
    "grid": "Every cell is one outcome of two fair dice and has probability 1/36. An event is a set of cells; its probability is just a count. The bars show the exact distribution of the sum."
  },
  "note": "All probabilities are exact (closed form or enumeration of the finite sample space). The simulation draws from a seeded generator and converges to the exact value at rate 1/√n — it illustrates the law of large numbers, it does not define the probability.",
  "formula": {
    "area": "P(A) = P(A|B)P(B) + P(A|¬B)P(¬B)    P(B|A) = P(A|B)P(B) / P(A)",
    "tree": "P(B|A) = #(A ∧ B) / #(A)",
    "grid": "P(E) = |E| / 36    P(E ∧ F) = |E ∩ F| / 36    independent ⇔ P(E ∧ F) = P(E)P(F)"
  },
  "insight": {
    "area": "When B is rare, even a very accurate test yields mostly false positives: the light-red area dwarfs the dark-blue one. Independence means the two horizontal lines are at the same height.",
    "tree": "Counting people avoids the base-rate fallacy: the 'accuracy' 90 % is P(A|B), the question is P(B|A).",
    "grid": "Sums near 7 have more ways to occur. 'Sum = 7' and 'first die = 1' are independent; 'sum = 12' and 'first die = 1' are not."
  },
  "scenarios": {
    "disease": "Screening test",
    "turnout": "Turnout intention",
    "indep": "Independent events"
  },
  "sliders": [
    "P(B) base rate",
    "P(A | B)",
    "P(A | ¬B)"
  ],
  "events": [
    "Sum = 7",
    "Doubles",
    "First die = 6",
    "Sum ≥ 10"
  ],
  "live": "P(A) = {pa}, P(B|A) = {pba}"
};

export type PpTStrings = typeof pp_t_en;

const pp_t_hu: PpTStrings = {
  "title": "Valószínűség-játszótér",
  "mode": "Nézet",
  "area": "Területmodell (eikozogram)",
  "tree": "Természetes gyakoriságok",
  "grid": "Két kocka",
  "areaNote": "szélesség = P(B) · magasságok = P(A | B), P(A | ¬B) · árnyékolt = A",
  "treeNote": "1 000 ember, kerekítve; a poszterior két doboz hányadosa",
  "gridNote": "kattints cellákra egy esemény megadásához a 36 egyenlően valószínű kimenetelen",
  "sim": "Szimuláció",
  "scenario": "Forgatókönyv",
  "lead": {
    "area": "Az egységnégyzet minden, ami történhet. Húzd a függőleges vonalat, hogy B gyakoriságát változtasd; a vízszinteseket, hogy A gyakoriságát B mellett és nélkül. P(B | A) a sötétkék terület aránya az összes árnyékolton belül.",
    "tree": "Ugyanazok a számok egész emberekkel. 1 000-ből hánynak van B-je? Közülük hány mutat A-t? A Bayes-tétel csak ennyi: az összes A-s között mekkora hányadnak van B-je is?",
    "grid": "Minden cella két szabályos kocka egy kimenetele, valószínűsége 1/36. Egy esemény cellák halmaza; valószínűsége egyszerűen egy darabszám. Az oszlopok az összeg pontos eloszlását mutatják."
  },
  "note": "Minden valószínűség pontos (zárt alak vagy a véges eseménytér felsorolása). A szimuláció seedelt generátorból húz, és 1/√n ütemben konvergál a pontos értékhez — a nagy számok törvényét illusztrálja, nem definiálja a valószínűséget.",
  "formula": {
    "area": "P(A) = P(A|B)P(B) + P(A|¬B)P(¬B)    P(B|A) = P(A|B)P(B) / P(A)",
    "tree": "P(B|A) = #(A ∧ B) / #(A)",
    "grid": "P(E) = |E| / 36    P(E ∧ F) = |E ∩ F| / 36    independent ⇔ P(E ∧ F) = P(E)P(F)"
  },
  "insight": {
    "area": "Ha B ritka, még egy nagyon pontos teszt is főleg hamis pozitívokat ad: a halványpiros terület eltörpíti a sötétkéket. A függetlenség azt jelenti, hogy a két vízszintes vonal azonos magasságban van.",
    "tree": "Az emberek számolása elkerüli az alapgyakoriság-tévedést: a 90 %-os 'pontosság' P(A|B), a kérdés P(B|A).",
    "grid": "A 7 körüli összegek többféleképpen jöhetnek ki. 'Összeg = 7' és 'első kocka = 1' függetlenek; 'összeg = 12' és 'első kocka = 1' nem."
  },
  "scenarios": {
    "disease": "Szűrőteszt",
    "turnout": "Részvételi szándék",
    "indep": "Független események"
  },
  "sliders": [
    "P(B) alapgyakoriság",
    "P(A | B)",
    "P(A | ¬B)"
  ],
  "events": [
    "Összeg = 7",
    "Dupla",
    "Első kocka = 6",
    "Összeg ≥ 10"
  ],
  "live": "P(A) = {pa}, P(B|A) = {pba}"
};

export const PP_T: Record<Lang, PpTStrings> = { en: pp_t_en, hu: pp_t_hu };
