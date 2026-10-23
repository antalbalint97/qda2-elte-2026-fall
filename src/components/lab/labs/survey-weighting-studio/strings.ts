// EN/HU strings transcribed from the V3 prototype (QDA2 Survey Weighting Studio.dc.html).
import type { Lang } from "@/content/curriculum/types";

const sws_t_en = {
  "title": "Survey Design & Weighting Studio",
  "unvalidated": "Hájek mean, linearised SE, closed forms and deff match R survey 4.2.1 on samples drawn by this studio (scripts/validation/studio_reference.R). Not validated: the SE after post-stratification or raking treats adjusted weights as fixed (the calibration step is ignored); two-stage samples use the with-replacement ultimate-cluster approximation.",
  "sampling": "Sampling Universe",
  "atlas": "Atlas",
  "teach": "Teach",
  "share": "Share",
  "copied": "Link copied",
  "stages": "Stages",
  "populationField": "Population field",
  "readouts": "Readouts",
  "formula": [
    "Ȳ = (1/N) Σ_U yₖ",
    "Ȳ_frame = (1/N_F) Σ_F yₖ ;  bias_cov = Ȳ_frame − Ȳ",
    "πₖ = n/N  (SRS) ;  n_h/N_h  (strat) ;  a/A  (cluster) ;  (a/A)(m/M_i)  (two-stage)",
    "dₖ = 1/πₖ ;  Σ_s dₖ ≈ N_F",
    "ȳ_unw = Σy/n ;  ȳ_HT = Σdy / N_F ;  ȳ_H = Σdy / Σd",
    "E[ȳ_H − Ȳ_F] ≈ Cov(ρₖ, yₖ)/ρ̄  — depends on the correlation of response with y, not on ρ̄ alone",
    "wₖ = dₖ · N_g / N̂_g   (post-strat) ;  iterate over margins (raking)",
    "V̂_lin = Σ_h a_h/(a_h−1) Σ_i (U_hi − Ū_h)² ,  U_hi = Σ_k∈i wₖ(yₖ − ȳ_H)/Σw",
    "deff = V̂_design / V̂_SRS ;  n_eff = n/deff ;  n_eff,w = (Σw)²/Σw²",
    "SD(ȳ_H over repeats) ≈ SE ;  mean(ȳ_H) − Ȳ_F ≈ bias"
  ],
  "task": "Task",
  "st": [
    "Population",
    "Frame",
    "Sample",
    "Inclusion prob.",
    "Estimates",
    "Nonresponse",
    "Adjustment",
    "Uncertainty",
    "Design effect",
    "Repeat"
  ],
  "title_": [
    "The finite population and its true mean",
    "The sampling frame and coverage error",
    "Selecting a probability sample",
    "Inclusion probabilities and base weights",
    "Unweighted, Horvitz–Thompson and Hájek estimates",
    "Nonresponse: rate is not bias",
    "Post-stratification and raking",
    "Three standard errors for one mean",
    "Design effect and effective sample size",
    "Repeat the experiment: bias and variance emerge"
  ],
  "lead": [
    "Every dot is one person. Three education groups differ in political-knowledge score (0–100). Ȳ is the quantity we want; it is fixed, we just cannot see it in practice.",
    "Only units on the frame can be sampled. Hollow dots are not on the frame. A perfect sample of a bad frame estimates the frame mean, not Ȳ.",
    "Choose a design and draw a sample. Dark rings mark sampled units; for cluster designs whole blocks are taken. One random sample is not automatically representative.",
    "Hover a unit: πₖ is set by the design, not estimated from data. The base weight dₖ = 1/πₖ says how many population units this one stands for. Dot size now shows dₖ.",
    "The unweighted mean treats every respondent as one person. HT divides the weighted total by the known N; Hájek divides by the sum of weights. Compare both with Ȳ and Ȳ_frame.",
    "Switch on a response mechanism. When responding depends on the outcome itself, the estimate drifts even though π and d are correct — the response rate alone tells you nothing about bias.",
    "Post-stratification matches weighted group counts to the known N_g; raking matches two margins. Composition is repaired; outcome-related bias is only partly removed. Benchmarks must be known from outside the survey.",
    "Naive s/√n ignores the design. The closed form applies to this design only. The linearised estimate honours strata, PSUs and weights (with-replacement approximation, as svydesign without fpc). Each bar is labelled with its method.",
    "deff = V_design / V_SRS at the same n. Kish's n_eff,w counts only unequal weights; clustering and stratification change precision independently of the weights. A nominal n of 120 can be worth 40 — or 150.",
    "Draw hundreds of samples from the same design. The histogram of Hájek means is the sampling distribution; its SD is the empirical standard error. Compare with the average linearised SE and with Ȳ."
  ],
  "legend": {
    "A": "Primary (A)",
    "B": "Secondary (B)",
    "C": "Tertiary (C)",
    "off": "not on frame",
    "samp": "sampled",
    "nr": "nonrespondent"
  },
  "sec": [
    "Composition: population vs frame",
    "Composition: population vs frame",
    "Composition: population vs sample",
    "Base weights dₖ = 1/πₖ",
    "Estimates on the 0–100 scale",
    "Composition: population vs respondents",
    "Weights after adjustment",
    "Standard error of the mean",
    "Precision summary",
    "Sampling distribution of the Hájek mean"
  ],
  "ctl": {
    "shares": "Group shares",
    "muC": "Mean of group C",
    "icc": "Intraclass correlation (clusters)",
    "covC": "Frame coverage of group C",
    "design": "Design",
    "n": "Sample size n",
    "alloc": "Allocation",
    "a": "PSUs selected a",
    "m": "Units per PSU m",
    "draw": "Draw",
    "again": "New sample",
    "mech": "Response mechanism",
    "rate": "Base response rate",
    "slope": "Outcome dependence",
    "adjust": "Adjustment",
    "showTruth": "Show Ȳ (truth)",
    "reps": "Repetitions",
    "run200": "Run 200",
    "run1000": "Run 1 000",
    "clear": "Clear",
    "mechOpts": {
      "none": "Full response",
      "mcar": "Random (MCAR)",
      "group": "By group",
      "outcome": "By outcome"
    },
    "adjOpts": {
      "none": "None",
      "poststrat": "Post-strat (group)",
      "raking": "Raking (group × x)"
    },
    "designOpts": {
      "srs": "SRS",
      "strat": "Stratified",
      "cluster": "Cluster",
      "twostage": "Two-stage"
    },
    "allocOpts": {
      "prop": "Proportional",
      "equal": "Equal"
    }
  },
  "notes": {
    "frame": "Coverage error does not shrink with n.",
    "nr": "Weights d = 1/π are still correct; the sample is not.",
    "adj": "Known benchmarks: N_g (census), x margins. Unknown: the outcome.",
    "deff": "Do not read deff as a property of the survey; it is a property of each estimate.",
    "rep": "Finite-simulation estimate; not an analytical value."
  },
  "est": {
    "truth": "Ȳ",
    "frame": "Ȳ_frame",
    "unw": "unweighted",
    "ht": "HT/N_frame",
    "hajek": "Hájek"
  },
  "se": {
    "naive": "Naive",
    "closed": "Closed form",
    "lin": "Linearised",
    "sim": "Empirical (repeats)"
  },
  "synthetic": "Synthetic finite population (N = 600, 20 clusters, seeded). The data-generating process is known, so every bias shown is real relative to Ȳ. No empirical claims.",
  "hover": "id {id} · group {g} · cluster {c} · y = {y}{pi}",
  "noHover": "hover or focus a unit",
  "live": "Stage {s}. {n} respondents. Hájek mean {h}. Linearised SE {se}."
};

export type SwsTStrings = typeof sws_t_en;

const sws_t_hu: SwsTStrings = {
  "title": "Survey tervezés és súlyozás stúdió",
  "unvalidated": "A Hájek-átlag, a linearizált SE, a zárt képletek és a deff egyezik az R survey 4.2.1 eredményeivel az itt húzott mintákon (scripts/validation/studio_reference.R). Nem validált: utólagos rétegzés vagy raking után az SE a korrigált súlyokat rögzítettnek tekinti (a kalibrációs lépést figyelmen kívül hagyja); kétlépcsős mintánál visszatevéses ultimate-cluster közelítés.",
  "sampling": "Mintavételi univerzum",
  "atlas": "Atlasz",
  "teach": "Vetítés",
  "share": "Megosztás",
  "copied": "Link másolva",
  "stages": "Szakaszok",
  "populationField": "Populációmező",
  "readouts": "Kiolvasások",
  "formula": [
    "Ȳ = (1/N) Σ_U yₖ",
    "Ȳ_frame = (1/N_F) Σ_F yₖ ;  bias_cov = Ȳ_frame − Ȳ",
    "πₖ = n/N  (SRS) ;  n_h/N_h  (strat) ;  a/A  (cluster) ;  (a/A)(m/M_i)  (two-stage)",
    "dₖ = 1/πₖ ;  Σ_s dₖ ≈ N_F",
    "ȳ_unw = Σy/n ;  ȳ_HT = Σdy / N_F ;  ȳ_H = Σdy / Σd",
    "E[ȳ_H − Ȳ_F] ≈ Cov(ρₖ, yₖ)/ρ̄  — depends on the correlation of response with y, not on ρ̄ alone",
    "wₖ = dₖ · N_g / N̂_g   (post-strat) ;  iterate over margins (raking)",
    "V̂_lin = Σ_h a_h/(a_h−1) Σ_i (U_hi − Ū_h)² ,  U_hi = Σ_k∈i wₖ(yₖ − ȳ_H)/Σw",
    "deff = V̂_design / V̂_SRS ;  n_eff = n/deff ;  n_eff,w = (Σw)²/Σw²",
    "SD(ȳ_H over repeats) ≈ SE ;  mean(ȳ_H) − Ȳ_F ≈ bias"
  ],
  "task": "Feladat",
  "st": [
    "Populáció",
    "Keret",
    "Minta",
    "Beválasztási val.",
    "Becslések",
    "Nemválaszolás",
    "Korrekció",
    "Bizonytalanság",
    "Mintatervhatás",
    "Ismétlés"
  ],
  "title_": [
    "A véges populáció és valódi átlaga",
    "A mintavételi keret és a lefedettségi hiba",
    "Valószínűségi minta kiválasztása",
    "Beválasztási valószínűségek és alapsúlyok",
    "Súlyozatlan, Horvitz–Thompson- és Hájek-becslés",
    "Nemválaszolás: az arány nem torzítás",
    "Utólagos rétegzés és raking",
    "Három standard hiba egy átlagra",
    "Mintatervhatás és effektív mintanagyság",
    "Ismételd a kísérletet: torzítás és variancia"
  ],
  "lead": [
    "Minden pont egy személy. Három iskolázottsági csoport politikai tudása (0–100) különbözik. Ȳ a keresett mennyiség: rögzített, csak a gyakorlatban nem látjuk.",
    "Csak a keretben lévő egységek kerülhetnek mintába. Az üres pontok nincsenek a keretben. Egy rossz keret tökéletes mintája a keret átlagát becsli, nem Ȳ-t.",
    "Válassz mintatervet és húzz mintát. A sötét karika a mintába került egységet jelöli; csoportos tervnél egész blokkok kerülnek be. Egy véletlen minta nem automatikusan reprezentatív.",
    "Vidd az egeret egy egységre: πₖ-t a terv adja, nem az adatból becsüljük. Az alapsúly dₖ = 1/πₖ: hány populációs egységet képvisel. A pont mérete most dₖ.",
    "A súlyozatlan átlag minden válaszolót egy főnek vesz. A HT a súlyozott összeget az ismert N-nel, a Hájek a súlyok összegével osztja. Vesd össze Ȳ-vel és Ȳ_keret-tel.",
    "Kapcsolj be válaszadási mechanizmust. Ha a válaszolás magától a kimenettől függ, a becslés elúszik, bár π és d helyes — a válaszadási arány önmagában semmit nem mond a torzításról.",
    "Az utólagos rétegzés a súlyozott csoportlétszámokat az ismert N_g-hez igazítja; a raking két peremet. Az összetétel helyreáll; a kimenettel összefüggő torzítás csak részben tűnik el. A benchmarkot a surveyen kívülről kell ismerni.",
    "A naiv s/√n figyelmen kívül hagyja a tervet. A zárt képlet csak erre a tervre érvényes. A linearizált becslés figyelembe veszi a rétegeket, PSU-kat és súlyokat (visszatevéses közelítés, mint svydesign fpc nélkül). Minden oszlopon ott a módszer neve.",
    "deff = V_terv / V_EVM azonos n mellett. Kish n_eff,w csak az egyenlőtlen súlyokat számolja; a csoportosítás és rétegzés a súlyoktól függetlenül változtatja a pontosságot. Egy névleges n = 120 érhet 40-et — vagy 150-et.",
    "Húzz több száz mintát ugyanabból a tervből. A Hájek-átlagok hisztogramja a mintavételi eloszlás; szórása az empirikus standard hiba. Vesd össze az átlagos linearizált SE-vel és Ȳ-vel."
  ],
  "legend": {
    "A": "Alapfok (A)",
    "B": "Középfok (B)",
    "C": "Felsőfok (C)",
    "off": "nincs a keretben",
    "samp": "mintában",
    "nr": "nem válaszolt"
  },
  "sec": [
    "Összetétel: populáció és keret",
    "Összetétel: populáció és keret",
    "Összetétel: populáció és minta",
    "Alapsúlyok dₖ = 1/πₖ",
    "Becslések a 0–100 skálán",
    "Összetétel: populáció és válaszolók",
    "Súlyok korrekció után",
    "Az átlag standard hibája",
    "Pontossági összefoglaló",
    "A Hájek-átlag mintavételi eloszlása"
  ],
  "ctl": {
    "shares": "Csoportarányok",
    "muC": "C csoport átlaga",
    "icc": "Osztályon belüli korreláció",
    "covC": "C csoport keretlefedettsége",
    "design": "Mintaterv",
    "n": "Mintanagyság n",
    "alloc": "Allokáció",
    "a": "Kiválasztott PSU-k a",
    "m": "Egység PSU-nként m",
    "draw": "Húzás",
    "again": "Új minta",
    "mech": "Válaszadási mechanizmus",
    "rate": "Alap válaszadási arány",
    "slope": "Kimenetfüggés",
    "adjust": "Korrekció",
    "showTruth": "Ȳ (valódi) mutatása",
    "reps": "Ismétlések",
    "run200": "200 futtatás",
    "run1000": "1 000 futtatás",
    "clear": "Törlés",
    "mechOpts": {
      "none": "Teljes válaszolás",
      "mcar": "Véletlen (MCAR)",
      "group": "Csoport szerint",
      "outcome": "Kimenet szerint"
    },
    "adjOpts": {
      "none": "Nincs",
      "poststrat": "Utólagos rétegzés",
      "raking": "Raking (csoport × x)"
    },
    "designOpts": {
      "srs": "EVM",
      "strat": "Rétegzett",
      "cluster": "Csoportos",
      "twostage": "Kétlépcsős"
    },
    "allocOpts": {
      "prop": "Arányos",
      "equal": "Egyenlő"
    }
  },
  "notes": {
    "frame": "A lefedettségi hiba nem csökken n-nel.",
    "nr": "A d = 1/π súlyok helyesek; a minta nem.",
    "adj": "Ismert benchmark: N_g (népszámlálás), x peremek. Ismeretlen: a kimenet.",
    "deff": "A deff nem a survey tulajdonsága, hanem az egyes becsléseké.",
    "rep": "Véges szimulációs becslés, nem analitikus érték."
  },
  "est": {
    "truth": "Ȳ",
    "frame": "Ȳ_keret",
    "unw": "súlyozatlan",
    "ht": "HT/N_keret",
    "hajek": "Hájek"
  },
  "se": {
    "naive": "Naiv",
    "closed": "Zárt képlet",
    "lin": "Linearizált",
    "sim": "Empirikus (ismétlés)"
  },
  "synthetic": "Szintetikus véges populáció (N = 600, 20 klaszter, seedelt). Az adatgeneráló folyamat ismert, így minden mutatott torzítás valós Ȳ-hez képest. Nincs empirikus állítás.",
  "hover": "id {id} · csoport {g} · klaszter {c} · y = {y}{pi}",
  "noHover": "vidd az egeret egy egységre",
  "live": "{s}. szakasz. {n} válaszoló. Hájek-átlag {h}. Linearizált SE {se}."
};

export const SWS_T: Record<Lang, SwsTStrings> = { en: sws_t_en, hu: sws_t_hu };
