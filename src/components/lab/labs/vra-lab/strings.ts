// EN/HU strings of the Variance → Regression → ANOVA lab, transcribed from the V3 prototype (QDA2 Lab.dc.html).
import type { Lang } from "@/content/curriculum/types";

const en = {
  "labTitle": "Variance → Regression → ANOVA",
  "s1": "Variance",
  "s2": "Regression",
  "s3": "ANOVA",
  "scenario": "Dataset",
  "scBase": "News & knowledge (default)",
  "scFlat": "No group differences",
  "scNoisy": "Wide within-group spread",
  "scSteep": "Strong linear relationship",
  "explore": "Explore",
  "learn": "Learn",
  "teach": "Teach",
  "reset": "Reset",
  "share": "Share",
  "copied": "Link copied",
  "fullscreen": "Full screen",
  "demo": "Demo",
  "l1": "Observations",
  "l2": "Mean",
  "l3": "Deviations",
  "l4": "Squares",
  "l5": "Sum",
  "predMean": "Mean of Y",
  "predCustom": "Your line",
  "predOls": "Least squares",
  "avTotal": "Total",
  "avWithin": "Within",
  "avBetween": "Between",
  "avBoth": "Both",
  "squares": "Squares",
  "synthetic": "Synthetic teaching data: 15 respondents, weekly news hours (X), political knowledge score 0–100 (Y), education group. Not empirical findings.",
  "dragHint": "Drag a point, or focus it and use the arrow keys. Hover a formula term to see it in the chart.",
  "measurements": "Measurements",
  "selected": "Selected observation",
  "selectHint": "Click a point to inspect it.",
  "group": "Group",
  "g0": "Primary",
  "g1": "Secondary",
  "g2": "Tertiary",
  "yourLine": "Your line",
  "intercept": "Intercept a",
  "slope": "Slope b",
  "scenarioControls": "Scenario controls",
  "separation": "Group mean separation",
  "spread": "Within-group spread",
  "scenarioHint": "Separation moves the Primary group down and the Tertiary group up by the same amount. Spread stretches each observation away from its own group mean. Both rewrite the data; drag a point to make the new values the baseline.",
  "formulas": "Formulas",
  "back": "Back",
  "next": "Next",
  "reveal": "Reveal explanation",
  "again": "Start over",
  "compareReg": "Compare with the regression decomposition",
  "xName": "X · news hours per week",
  "yName": "Y · political knowledge (0–100)",
  "yOnly": "Political knowledge score (0–100)",
  "respondent": "Respondent",
  "s1Title": "How far do the observations sit from their mean?",
  "s1Sub": "Fifteen knowledge scores, one at a time. Build the variance layer by layer: deviations become squares, squares add up to the sum of squares, and the average square is the variance.",
  "s2Title": "Predict each score — and measure what is left over",
  "s2Sub": "The same fifteen people, now with their news hours on X. Every prediction leaves a residual; the model that leaves the smallest total squared residual is the least-squares line.",
  "s3Title": "Predict each score with its group mean",
  "s3Sub": "Same fifteen people, grouped by education. Total variation around the grand mean splits into variation between group means and variation left within groups.",
  "sample": "sample (n − 1)",
  "population": "population (n)",
  "decompS1": "Sum of squares, piece by piece",
  "decompS2": "Variation accounted for and left over",
  "decompS3": "Decomposition of total variation",
  "noteNoX": "X has no variation: the slope is undefined and no regression line exists.",
  "noteZeroWithin": "No variation within groups: MS within is 0, so F is undefined.",
  "noteSmall": "A group has fewer than 2 observations; within-group variance cannot be estimated for it.",
  "pNote": "p comes from the F distribution with the degrees of freedom shown and assumes independent, roughly normal groups with similar variances. η² describes the sample; p concerns inference. A large η² can go with a large p in small samples.",
  "olsNote": "For the least-squares line with an intercept, SST = SSR + SSE exactly. The explained share SSR/SST is R².",
  "customNote": "Your line has a sum of squared errors; it is compared with SST. The split SST = SSR + SSE holds only for the least-squares line, so no decomposition is drawn here.",
  "meanNoteS2": "Predicting everyone with ȳ leaves the full total sum of squares. This is the baseline every model is measured against.",
  "anovaNote": "SS total = SS between + SS within always holds. η² = SS between / SS total is the share of variation associated with group membership.",
  "compareNote": "Both bars start from the same SST, because the same fifteen scores are being predicted. Regression predicts with a line in X; ANOVA predicts with group means. Their explained parts are different quantities and need not be equal.",
  "s1Note": "Each segment is one respondent's squared deviation. Together they are SS; divided by the degrees of freedom they are the variance.",
  "found": "You found the least-squares line: no other straight line leaves a smaller SSE.",
  "keepGoing": "Your line leaves SSE = {sse}. The best possible straight line leaves {best}. Tilt and shift it.",
  "worse": "Your line is worse than simply predicting the mean (SSE > SST).",
  "ssbLabel": "n·(ȳⱼ − ȳ)²",
  "prompt": "Challenge",
  "predict": "Predict",
  "experiment": "Experiment",
  "explain": "Explain",
  "transfer": "Transfer"
};

export type VraStrings = typeof en;

const hu: VraStrings = {
  "labTitle": "Variancia → Regresszió → ANOVA",
  "s1": "Variancia",
  "s2": "Regresszió",
  "s3": "ANOVA",
  "scenario": "Adatok",
  "scBase": "Hírek és tudás (alap)",
  "scFlat": "Nincs csoportkülönbség",
  "scNoisy": "Nagy csoporton belüli szórás",
  "scSteep": "Erős lineáris kapcsolat",
  "explore": "Felfedez",
  "learn": "Tanul",
  "teach": "Tanít",
  "reset": "Alaphelyzet",
  "share": "Megosztás",
  "copied": "Link másolva",
  "fullscreen": "Teljes képernyő",
  "demo": "Demó",
  "l1": "Megfigyelések",
  "l2": "Átlag",
  "l3": "Eltérések",
  "l4": "Négyzetek",
  "l5": "Összeg",
  "predMean": "Y átlaga",
  "predCustom": "Saját egyenes",
  "predOls": "Legkisebb négyzetek",
  "avTotal": "Teljes",
  "avWithin": "Belső",
  "avBetween": "Közötti",
  "avBoth": "Mindkettő",
  "squares": "Négyzetek",
  "synthetic": "Szintetikus oktatási adat: 15 válaszadó, heti hírfogyasztás órában (X), politikai tudás 0–100 (Y), iskolázottsági csoport. Nem empirikus eredmény.",
  "dragHint": "Húzd a pontot, vagy fókuszáld és használd a nyilakat. Vidd az egeret egy képlettagra, hogy lásd az ábrán.",
  "measurements": "Mérőszámok",
  "selected": "Kijelölt megfigyelés",
  "selectHint": "Kattints egy pontra.",
  "group": "Csoport",
  "g0": "Alapfok",
  "g1": "Középfok",
  "g2": "Felsőfok",
  "yourLine": "Saját egyenes",
  "intercept": "Tengelymetszet a",
  "slope": "Meredekség b",
  "scenarioControls": "Forgatókönyv",
  "separation": "Csoportátlagok távolsága",
  "spread": "Csoporton belüli szórás",
  "scenarioHint": "A távolság az Alapfok csoportot lefelé, a Felsőfokot felfelé tolja ugyanannyival. A szórás minden megfigyelést a saját csoportátlagától távolít. Mindkettő átírja az adatot; egy pont húzása az új értékeket teszi kiindulóponttá.",
  "formulas": "Képletek",
  "back": "Vissza",
  "next": "Tovább",
  "reveal": "Magyarázat",
  "again": "Újra",
  "compareReg": "Összevetés a regressziós felbontással",
  "xName": "X · heti híróra",
  "yName": "Y · politikai tudás (0–100)",
  "yOnly": "Politikai tudás pontszám (0–100)",
  "respondent": "Válaszadó",
  "s1Title": "Milyen messze vannak a megfigyelések az átlaguktól?",
  "s1Sub": "Tizenöt tudáspontszám. Építsd fel a varianciát rétegenként: az eltérésekből négyzetek, a négyzetekből négyzetösszeg, az átlagos négyzet a variancia.",
  "s2Title": "Jósold meg a pontszámokat — és mérd, mi marad",
  "s2Sub": "Ugyanaz a tizenöt ember, most a híróráikkal az X tengelyen. Minden előrejelzés reziduumot hagy; a legkisebb négyzetes reziduum-összeget hagyó modell a legkisebb négyzetek egyenese.",
  "s3Title": "Jósold meg a pontszámot a csoportátlaggal",
  "s3Sub": "Ugyanaz a tizenöt ember iskolázottság szerint. A főátlag körüli teljes variancia a csoportátlagok közötti és a csoporton belüli részre bomlik.",
  "sample": "minta (n − 1)",
  "population": "sokaság (n)",
  "decompS1": "Négyzetösszeg darabonként",
  "decompS2": "Megmagyarázott és maradék variancia",
  "decompS3": "A teljes variancia felbontása",
  "noteNoX": "X-nek nincs szórása: a meredekség nem értelmezett, nincs regressziós egyenes.",
  "noteZeroWithin": "Nincs csoporton belüli szórás: MS belső = 0, F nem értelmezett.",
  "noteSmall": "Egy csoportban 2-nél kevesebb megfigyelés van; a belső variancia ott nem becsülhető.",
  "pNote": "A p az F-eloszlásból jön a mutatott szabadságfokokkal; független, közel normális, hasonló szórású csoportokat feltételez. Az η² a mintát írja le, a p a következtetést. Kis mintában nagy η² mellett is lehet nagy p.",
  "olsNote": "A tengelymetszetes legkisebb négyzetek egyenesére SST = SSR + SSE pontosan. A megmagyarázott hányad SSR/SST = R².",
  "customNote": "A saját egyenesednek van hibanégyzet-összege; ezt az SST-hez mérjük. Az SST = SSR + SSE felbontás csak a legkisebb négyzetek egyenesére igaz, ezért itt nincs felbontás rajzolva.",
  "meanNoteS2": "Ha mindenkit ȳ-nal jósolunk, a teljes négyzetösszeg marad. Ez a kiindulópont, amihez minden modellt mérünk.",
  "anovaNote": "SS teljes = SS közötti + SS belső mindig igaz. η² = SS közötti / SS teljes a csoporttagsághoz köthető hányad.",
  "compareNote": "Mindkét sáv ugyanabból az SST-ből indul, mert ugyanazt a tizenöt pontszámot jósoljuk. A regresszió X szerinti egyenessel, az ANOVA csoportátlagokkal jósol. A megmagyarázott részük más mennyiség, nem kell egyenlőnek lenniük.",
  "s1Note": "Minden szakasz egy válaszadó négyzetes eltérése. Együtt az SS; a szabadságfokkal osztva a variancia.",
  "found": "Megtaláltad a legkisebb négyzetek egyenesét: nincs egyenes, ami kisebb SSE-t hagy.",
  "keepGoing": "Az egyenesed SSE = {sse}-t hagy. A legjobb egyenes {best}-t. Döntsd és told.",
  "worse": "Az egyenesed rosszabb, mint az átlaggal jósolni (SSE > SST).",
  "ssbLabel": "n·(ȳⱼ − ȳ)²",
  "prompt": "Kihívás",
  "predict": "Jósolj",
  "experiment": "Kísérletezz",
  "explain": "Magyarázd",
  "transfer": "Alkalmazd"
};

export const VRA_T: Record<Lang, VraStrings> = { en, hu };

/** Learn-mode prompts per stage: Predict, Experiment, Explain, Transfer. */
export const VRA_GUIDES: Record<Lang, Record<1 | 2 | 3, [string, string, string, string]>> = {
  "en": {
    "1": [
      "Can you move one observation so the variance rises sharply while the mean barely moves?",
      "Pick an observation near the mean and drag it far away. Watch the mean line and the squares.",
      "The mean shifts by (change ÷ n), but the squared deviation grows with the square of the distance. One far point can dominate SS.",
      "Switch to the “Wide within-group spread” dataset: same means, larger squares. Which single value would you move to halve the variance?"
    ],
    "2": [
      "Before pressing “Least squares”: where should the line go to leave the smallest total squared residual?",
      "Choose “Your line”, drag the two handles, and watch SSE. Try to beat the mean-only baseline first.",
      "Residuals are squared, so a few large ones cost more than many small ones. The least-squares line balances them so that SST = SSR + SSE exactly.",
      "Drag respondent O far above the line. How much does R² change for one point? Association here says nothing about causation."
    ],
    "3": [
      "Can you make F larger without moving the group means further apart?",
      "Reduce “Within-group spread”. SS between stays the same; SS within shrinks.",
      "F compares the between-group mean square with the within-group mean square. Shrinking noise inside groups makes the same mean differences stand out.",
      "Press “Compare with the regression decomposition”: same SST, two different models. Why can SSR and SS between differ?"
    ]
  },
  "hu": {
    "1": [
      "Tudsz úgy mozgatni egy megfigyelést, hogy a variancia nagyot nőjön, de az átlag alig mozduljon?",
      "Válassz egy átlaghoz közeli pontot és húzd messzire. Figyeld az átlagvonalat és a négyzeteket.",
      "Az átlag (változás ÷ n)-nel tolódik, a négyzetes eltérés viszont a távolság négyzetével nő. Egyetlen távoli pont uralhatja az SS-t.",
      "Válts a „Nagy csoporton belüli szórás” adatra: azonos átlagok, nagyobb négyzetek. Melyik értéket mozgatnád, hogy felezd a varianciát?"
    ],
    "2": [
      "Mielőtt megnyomod a „Legkisebb négyzetek”-et: hová kerüljön az egyenes, hogy a legkisebb legyen a reziduum-négyzetösszeg?",
      "Válaszd a „Saját egyenes”-t, húzd a két fogantyút, és figyeld az SSE-t. Előbb az átlag-modellt győzd le.",
      "A reziduumokat négyzetre emeljük, ezért néhány nagy többe kerül, mint sok kicsi. A legkisebb négyzetek egyenese úgy egyensúlyoz, hogy SST = SSR + SSE pontosan.",
      "Húzd O válaszadót messze az egyenes fölé. Mennyit változik R² egy pont miatt? Az együttjárás itt semmit nem mond az okságról."
    ],
    "3": [
      "Tudod növelni F-et anélkül, hogy a csoportátlagok távolabb kerülnének?",
      "Csökkentsd a „Csoporton belüli szórás”-t. SS közötti marad; SS belső zsugorodik.",
      "F a csoportok közötti és a csoporton belüli átlagos négyzetet hasonlítja össze. A csoporton belüli zaj csökkenése ugyanazokat az átlagkülönbségeket élesebbé teszi.",
      "Nyomd meg az „Összevetés a regressziós felbontással”-t: azonos SST, két különböző modell. Miért térhet el SSR és SS közötti?"
    ]
  }
};

export interface VraDemo {
  stage: 1 | 2 | 3;
  layer?: 1 | 2 | 3 | 4 | 5;
  pred?: "mean" | "custom" | "ols";
  av?: "total" | "within" | "between" | "both";
  scenario?: "base" | "flat" | "noisy" | "steep";
  spread?: number;
  pts?: Record<string, number>;
}

/** Teach-mode demos: [title, note, state]. */
export const VRA_DEMOS: Record<Lang, [string, string, VraDemo][]> = {
  "en": [
    [
      "The mean as a balance point",
      "Drag any score; the mean line follows.",
      {
        "stage": 1,
        "layer": 3
      }
    ],
    [
      "Deviations become squares",
      "Side = deviation, area = squared deviation.",
      {
        "stage": 1,
        "layer": 4
      }
    ],
    [
      "One outlier, one huge square",
      "Respondent O moved to 100.",
      {
        "stage": 1,
        "layer": 5,
        "pts": {
          "O": 100
        }
      }
    ],
    [
      "Baseline: predict everyone with ȳ",
      "All of SST is left over.",
      {
        "stage": 2,
        "pred": "mean"
      }
    ],
    [
      "Rotate to the least-squares line",
      "SSE shrinks; SST = SSR + SSE.",
      {
        "stage": 2,
        "pred": "ols"
      }
    ],
    [
      "Group means as predictions",
      "Within (coral) and between (violet).",
      {
        "stage": 3,
        "av": "both"
      }
    ],
    [
      "Same means, less noise, larger F",
      "Within-group spread reduced.",
      {
        "stage": 3,
        "av": "both",
        "spread": 0.4
      }
    ],
    [
      "No group differences",
      "F near 1, p large.",
      {
        "stage": 3,
        "av": "both",
        "scenario": "flat"
      }
    ]
  ],
  "hu": [
    [
      "Az átlag mint egyensúlyi pont",
      "Húzz egy pontot; az átlagvonal követi.",
      {
        "stage": 1,
        "layer": 3
      }
    ],
    [
      "Az eltérésekből négyzetek",
      "Oldal = eltérés, terület = négyzetes eltérés.",
      {
        "stage": 1,
        "layer": 4
      }
    ],
    [
      "Egy kiugró érték, egy óriási négyzet",
      "O válaszadó 100-ra tolva.",
      {
        "stage": 1,
        "layer": 5,
        "pts": {
          "O": 100
        }
      }
    ],
    [
      "Kiindulás: mindenkit ȳ-nal jósolunk",
      "A teljes SST megmarad.",
      {
        "stage": 2,
        "pred": "mean"
      }
    ],
    [
      "Forgatás a legkisebb négyzetek egyeneséig",
      "SSE csökken; SST = SSR + SSE.",
      {
        "stage": 2,
        "pred": "ols"
      }
    ],
    [
      "Csoportátlagok mint előrejelzés",
      "Belső (korall) és közötti (lila).",
      {
        "stage": 3,
        "av": "both"
      }
    ],
    [
      "Azonos átlagok, kisebb zaj, nagyobb F",
      "Csoporton belüli szórás csökkentve.",
      {
        "stage": 3,
        "av": "both",
        "spread": 0.4
      }
    ],
    [
      "Nincs csoportkülönbség",
      "F ≈ 1, p nagy.",
      {
        "stage": 3,
        "av": "both",
        "scenario": "flat"
      }
    ]
  ]
};

/** Explanations shown when a formula term is inspected. */
export const VRA_EXPLAIN: Record<Lang, Record<string, string>> = {
  "en": {
    "xi": "xᵢ: one observation. Click a point to see its own row.",
    "mean": "x̄ = Σxᵢ / n: the balance point of the observations; deviations always sum to 0.",
    "dev": "xᵢ − x̄: the deviation, the vertical segment between a point and the mean line.",
    "sq": "(xᵢ − x̄)²: a square whose side is the deviation and whose area is the squared deviation. Large deviations count disproportionately.",
    "sum": "Σ: the sum of the squares. In the strip below, every segment is one square's area.",
    "n1": "n − 1: the sample's degrees of freedom. The deviations sum to 0, so only n − 1 are free; dividing by n − 1 gives an unbiased estimate of the population variance. Switch to n for the population formula.",
    "sqrt": "√: the square root of the variance returns the original units: the standard deviation is the side of the “average square”.",
    "yhat": "ŷᵢ = a + b·xᵢ: the prediction, the height of the line at that X.",
    "resid": "eᵢ = yᵢ − ŷᵢ: the residual, the vertical distance from observed to predicted.",
    "sse": "SSE = Σeᵢ²: the sum of squared residuals. The least-squares line minimises it.",
    "sst": "SST = Σ(yᵢ − ȳ)²: total variation when everyone is predicted with the mean.",
    "ssr": "SSR = Σ(ŷᵢ − ȳ)²: how far the line's predictions deviate from the mean. SST = SSR + SSE holds only for the least-squares line.",
    "r2": "R² = SSR / SST = 1 − SSE / SST: the share accounted for. Not causation.",
    "grand": "ȳ: the grand mean of all 15 scores.",
    "gmean": "ȳⱼ: the mean of group j, the ANOVA prediction for every member of that group.",
    "within": "SS within = ΣΣ(yᵢⱼ − ȳⱼ)²: what is left around each group mean (coral).",
    "between": "SS between = Σnⱼ(ȳⱼ − ȳ)²: distance of group means from the grand mean, weighted by group size (violet). The small square has side |ȳⱼ − ȳ|; SS between adds nⱼ copies of it.",
    "msb": "MS between = SS between / (k − 1).",
    "msw": "MS within = SS within / (N − k).",
    "F": "F = MS between / MS within: how many times larger the between-group mean square is than the within-group one.",
    "eta": "η² = SS between / SS total: an effect size, the share accounted for in this sample.",
    "p": "p: if the population means were equal, an F this large or larger would occur with this probability. F distribution with (k − 1, N − k) degrees of freedom."
  },
  "hu": {
    "xi": "xᵢ: egy megfigyelés. Kattints egy pontra, hogy lásd a saját sorát.",
    "mean": "x̄ = Σxᵢ / n: a megfigyelések egyensúlyi pontja; az eltérések összege mindig 0.",
    "dev": "xᵢ − x̄: az eltérés, a pont és az átlagvonal közti függőleges szakasz.",
    "sq": "(xᵢ − x̄)²: a négyzet oldala az eltérés, területe a négyzetes eltérés. A nagy eltérések aránytalanul sokat számítanak.",
    "sum": "Σ: a négyzetek összege. Az alsó sávban minden szakasz egy-egy négyzet területe.",
    "n1": "n − 1: a minta szabadságfoka. Az eltérések összege 0, így csak n − 1 szabad; ezzel osztva torzítatlan a sokasági varianciabecslés. Váltás n-re a sokasági képlethez.",
    "sqrt": "√: a variancia négyzetgyöke visszaadja az eredeti mértékegységet: a szórás az „átlagos négyzet” oldala.",
    "yhat": "ŷᵢ = a + b·xᵢ: az előrejelzés, az egyenes magassága az adott X-nél.",
    "resid": "eᵢ = yᵢ − ŷᵢ: a reziduum, a megfigyelt és a jósolt érték függőleges távolsága.",
    "sse": "SSE = Σeᵢ²: a reziduumok négyzetösszege. A legkisebb négyzetek egyenese ezt minimalizálja.",
    "sst": "SST = Σ(yᵢ − ȳ)²: a teljes variancia, ha mindenkit az átlaggal jósolunk.",
    "ssr": "SSR = Σ(ŷᵢ − ȳ)²: amennyivel az egyenes előrejelzései eltérnek az átlagtól. Csak OLS-nél igaz, hogy SST = SSR + SSE.",
    "r2": "R² = SSR / SST = 1 − SSE / SST: a megmagyarázott hányad. Nem ok-okozat.",
    "grand": "ȳ: a főátlag, mind a 15 pontszám átlaga.",
    "gmean": "ȳⱼ: a j-edik csoport átlaga — ez az ANOVA előrejelzése minden csoporttagnak.",
    "within": "SS belső = ΣΣ(yᵢⱼ − ȳⱼ)²: a csoportátlag körüli maradék (korall).",
    "between": "SS közötti = Σnⱼ(ȳⱼ − ȳ)²: a csoportátlagok távolsága a főátlagtól, csoportmérettel súlyozva (lila). A kis négyzet oldala |ȳⱼ − ȳ|; az SS közötti ebből nⱼ darabot ad össze.",
    "msb": "MS közötti = SS közötti / (k − 1).",
    "msw": "MS belső = SS belső / (N − k).",
    "F": "F = MS közötti / MS belső: hányszor nagyobb a csoportok közötti átlagos négyzet a belsőnél.",
    "eta": "η² = SS közötti / SS teljes: hatásméret, a mintában megmagyarázott hányad.",
    "p": "p: ha a sokasági átlagok egyenlők, ekkora vagy nagyobb F ekkora valószínűséggel fordul elő. F-eloszlás (k − 1, N − k) szabadságfokkal."
  }
};
