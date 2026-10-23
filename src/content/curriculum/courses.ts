// Ported from the QDA2 V3 design package (data/courses.js); ids preserved verbatim. Edit here — this file is the source of truth.
// Course templates (Course → Unit → Lesson → BlockInstance). Drafts edited in the Course Builder never change these.
import type { CourseTemplate } from "./types";

export const COURSE_TEMPLATES: CourseTemplate[] = [
 {
  "id": "course.qda2",
  "version": "1.0.0",
  "state": "draft",
  "lang": "en",
  "title": {
   "en": "Quantitative Data Analysis 2",
   "hu": "Kvantitatív adatelemzés 2"
  },
  "description": "A 14-week applied course on describing, comparing and modelling survey data with SPSS, built on the analysis chain research question → variables → roles → levels → method → logic → software → output → conclusion.",
  "audience": "2nd-year social science BA students who completed QDA1 (descriptives, index construction).",
  "prerequisites": [
   "QDA1 or equivalent",
   "Basic SPSS data view"
  ],
  "outcomes": [
   "Choose the appropriate bivariate method from measurement levels and roles",
   "Read and interpret crosstab, correlation, t-test, ANOVA and regression output",
   "Distinguish statistical significance from effect size",
   "Control for a third variable and classify the Lazarsfeld pattern",
   "Report results in a defensible, reproducible way"
  ],
  "workload": "2 × 90 min per week + ~2 h self-study; 28 ECTS-hours contact",
  "software": [
   "SPSS (primary)",
   "R optional bridge in week 13"
  ],
  "assessment": {
   "formative": "Weekly quiz blocks (first attempt counts, local only)",
   "final": "Independent research project on the course data set (weeks 13–14)"
  },
  "instructorNotes": "Mirrors the existing 9-module site plus the VRA lab. Weeks 1–2 may be compressed to one if QDA1 is fresh. Teach Welch by default; Levene demo is diagnostic, not a gate.",
  "units": [
   {
    "id": "u1",
    "title": {
     "en": "Week 1 · Research questions and measurement levels",
     "hu": "1. hét · Kutatási kérdés és mérési szintek"
    },
    "lessons": [
     {
      "id": "u1l1",
      "title": {
       "en": "From question to variables",
       "hu": "Kérdéstől a változókig"
      },
      "blocks": [
       {
        "ref": "c.research-question"
       },
       {
        "ref": "c.measurement-levels"
       },
       {
        "ref": "x.classify-levels"
       },
       {
        "ref": "c.variable-roles"
       },
       {
        "ref": "x.role-swap"
       },
       {
        "ref": "a.levels-roles"
       }
      ]
     }
    ]
   },
   {
    "id": "u2",
    "title": {
     "en": "Week 2 · Data preparation and descriptive statistics",
     "hu": "2. hét · Adatelőkészítés és leíró statisztika"
    },
    "lessons": [
     {
      "id": "u2l1",
      "title": {
       "en": "Centre, spread and the mean as a model",
       "hu": "Közép, szóródás, az átlag mint modell"
      },
      "blocks": [
       {
        "ref": "ds.news-knowledge"
       },
       {
        "ref": "c.data-quality"
       },
       {
        "ref": "c.centre"
       },
       {
        "ref": "c.same-mean"
       },
       {
        "ref": "p.n-minus-1"
       },
       {
        "ref": "l.vra-stage1"
       },
       {
        "ref": "m.variance"
       },
       {
        "ref": "sw.spss-frequencies"
       },
       {
        "ref": "a.descriptives"
       }
      ]
     }
    ]
   },
   {
    "id": "u3",
    "title": {
     "en": "Week 3 · Crosstabs and conditional percentages",
     "hu": "3. hét · Kereszttáblák és feltételes százalékok"
    },
    "lessons": [
     {
      "id": "u3l1",
      "title": {
       "en": "Which percentage?",
       "hu": "Melyik százalék?"
      },
      "blocks": [
       {
        "ref": "c.crosstab-percent"
       },
       {
        "ref": "l.categorical-mosaic",
        "variant": {
         "config": {
          "rows": 2,
          "cols": 2,
          "keep": "margins"
         },
         "notes": "Start with the 2×2 from the lecture slides."
        }
       },
       {
        "ref": "sw.spss-crosstabs"
       }
      ]
     }
    ]
   },
   {
    "id": "u4",
    "title": {
     "en": "Week 4 · Chi-square and association measures",
     "hu": "4. hét · Khi-négyzet és asszociációs mérőszámok"
    },
    "lessons": [
     {
      "id": "u4l1",
      "title": {
       "en": "Significance vs strength",
       "hu": "Szignifikancia és erősség"
      },
      "blocks": [
       {
        "ref": "p.chi-scale"
       },
       {
        "ref": "l.categorical-mosaic"
       },
       {
        "ref": "m.chi-square"
       },
       {
        "ref": "a.crosstabs"
       }
      ]
     }
    ]
   },
   {
    "id": "u5",
    "title": {
     "en": "Week 5 · Lazarsfeld and control variables",
     "hu": "5. hét · Lazarsfeld és kontrollváltozók"
    },
    "lessons": [
     {
      "id": "u5l1",
      "title": {
       "en": "What happens to X → Y under Z",
       "hu": "Mi történik X → Y-nal Z mellett"
      },
      "blocks": [
       {
        "ref": "c.lazarsfeld"
       },
       {
        "ref": "l.lazarsfeld-scenarios"
       },
       {
        "ref": "x.simpson-flip"
       },
       {
        "ref": "r.causal-order"
       },
       {
        "ref": "a.lazarsfeld"
       }
      ]
     }
    ]
   },
   {
    "id": "u6",
    "title": {
     "en": "Week 6 · Covariance and correlation",
     "hu": "6. hét · Kovariancia és korreláció"
    },
    "lessons": [
     {
      "id": "u6l1",
      "title": {
       "en": "Direction, strength, and what r misses",
       "hu": "Irány, erősség, és amit r nem lát"
      },
      "blocks": [
       {
        "ref": "c.covariance"
       },
       {
        "ref": "l.guess-r"
       },
       {
        "ref": "x.ushape"
       },
       {
        "ref": "c.pearson-spearman"
       },
       {
        "ref": "sw.spss-correlate"
       },
       {
        "ref": "a.correlation"
       }
      ]
     }
    ]
   },
   {
    "id": "u7",
    "title": {
     "en": "Week 7 · Sampling, estimation and standard error",
     "hu": "7. hét · Mintavétel, becslés, standard hiba"
    },
    "lessons": [
     {
      "id": "u7l1",
      "title": {
       "en": "Why samples disagree",
       "hu": "Miért térnek el a minták"
      },
      "blocks": [
       {
        "ref": "c.population-sample"
       },
       {
        "ref": "p.se-n"
       },
       {
        "ref": "l.sampling-universe"
       },
       {
        "ref": "x.clt-shape"
       },
       {
        "ref": "m.standard-error"
       },
       {
        "ref": "x.variance-bias"
       },
       {
        "ref": "c.ci-logic"
       },
       {
        "ref": "l.ci-explorer"
       }
      ]
     }
    ]
   },
   {
    "id": "u8",
    "title": {
     "en": "Week 8 · Hypothesis testing and significance",
     "hu": "8. hét · Hipotézisvizsgálat és szignifikancia"
    },
    "lessons": [
     {
      "id": "u8l1",
      "title": {
       "en": "The p-value",
       "hu": "A p-érték"
      },
      "blocks": [
       {
        "ref": "c.p-value"
       },
       {
        "ref": "l.hypothesis-null"
       },
       {
        "ref": "x.sample-size-p"
       },
       {
        "ref": "c.errors-power"
       },
       {
        "ref": "a.p-values"
       }
      ]
     }
    ]
   },
   {
    "id": "u9",
    "title": {
     "en": "Week 9 · t-tests and mean comparisons",
     "hu": "9. hét · t-próbák és átlag-összehasonlítás"
    },
    "lessons": [
     {
      "id": "u9l1",
      "title": {
       "en": "Two means",
       "hu": "Két átlag"
      },
      "blocks": [
       {
        "ref": "c.t-choice"
       },
       {
        "ref": "l.ttest-lab"
       },
       {
        "ref": "c.welch-default"
       },
       {
        "ref": "c.effect-size-d"
       },
       {
        "ref": "sw.spss-ttest"
       },
       {
        "ref": "a.t-tests"
       }
      ]
     }
    ]
   },
   {
    "id": "u10",
    "title": {
     "en": "Week 10 · ANOVA and variance decomposition",
     "hu": "10. hét · ANOVA és varianciafelbontás"
    },
    "lessons": [
     {
      "id": "u10l1",
      "title": {
       "en": "Three means and the F ratio",
       "hu": "Három átlag és az F-hányados"
      },
      "blocks": [
       {
        "ref": "ds.news-knowledge"
       },
       {
        "ref": "p.sep-spread"
       },
       {
        "ref": "l.vra-stage3"
       },
       {
        "ref": "m.f-ratio"
       },
       {
        "ref": "c.post-hoc"
       },
       {
        "ref": "sw.spss-anova"
       },
       {
        "ref": "a.anova"
       }
      ]
     }
    ]
   },
   {
    "id": "u11",
    "title": {
     "en": "Week 11 · Linear regression",
     "hu": "11. hét · Lineáris regresszió"
    },
    "lessons": [
     {
      "id": "u11l1",
      "title": {
       "en": "From the mean to the line",
       "hu": "Az átlagtól az egyenesig"
      },
      "blocks": [
       {
        "ref": "p.custom-line"
       },
       {
        "ref": "l.vra-stage2"
       },
       {
        "ref": "m.sst-ssr-sse"
       },
       {
        "ref": "c.regression-output"
       },
       {
        "ref": "con.anova-is-regression"
       },
       {
        "ref": "sw.spss-regression"
       }
      ]
     }
    ]
   },
   {
    "id": "u12",
    "title": {
     "en": "Week 12 · Standardization, indexes and PCA",
     "hu": "12. hét · Standardizálás, indexek és PCA"
    },
    "lessons": [
     {
      "id": "u12l1",
      "title": {
       "en": "Many items, one score",
       "hu": "Sok item, egy pontszám"
      },
      "blocks": [
       {
        "ref": "ds.index-120"
       },
       {
        "ref": "c.z-scores"
       },
       {
        "ref": "c.index-why"
       },
       {
        "ref": "l.index-builder"
       },
       {
        "ref": "c.reliability-validity"
       },
       {
        "ref": "sw.spss-reliability"
       },
       {
        "ref": "c.pca-intro"
       },
       {
        "ref": "l.pca-probe"
       },
       {
        "ref": "con.pca-vs-fa"
       }
      ]
     }
    ]
   },
   {
    "id": "u13",
    "title": {
     "en": "Week 13 · Applied statistical workflow",
     "hu": "13. hét · Alkalmazott statisztikai munkafolyamat"
    },
    "lessons": [
     {
      "id": "u13l1",
      "title": {
       "en": "The chain end to end",
       "hu": "A lánc elejétől végéig"
      },
      "blocks": [
       {
        "ref": "c.workflow"
       },
       {
        "ref": "ds.sopranos"
       },
       {
        "ref": "a.quick-review"
       },
       {
        "ref": "r.defensible-conclusion"
       },
       {
        "ref": "sw.r-python-bridge"
       }
      ]
     }
    ]
   },
   {
    "id": "u14",
    "title": {
     "en": "Week 14 · Independent research project",
     "hu": "14. hét · Önálló kutatási projekt"
    },
    "lessons": [
     {
      "id": "u14l1",
      "title": {
       "en": "Project",
       "hu": "Projekt"
      },
      "blocks": [
       {
        "ref": "c.ethics-provenance"
       },
       {
        "ref": "x.project-brief"
       }
      ]
     }
    ]
   }
  ]
 },
 {
  "id": "course.survey",
  "version": "1.0.0",
  "state": "draft",
  "lang": "en",
  "title": {
   "en": "Survey Statistics",
   "hu": "Survey-statisztika"
  },
  "description": "A 14-week course on design-based inference from complex samples: from total survey error through sampling designs, weights and calibration to design-based variance estimation and reproducible analysis in R.",
  "audience": "MA students in sociology, survey methodology or applied statistics; QDA2 or an equivalent inference course assumed.",
  "prerequisites": [
   "Descriptive statistics, sampling distributions, CIs and t/χ² tests",
   "Basic R or willingness to learn it in weeks 1–4"
  ],
  "outcomes": [
   "Decompose survey error and identify which components a design addresses",
   "Compute inclusion probabilities and base weights for SRS, stratified, cluster, multistage and PPS designs",
   "Apply and critique nonresponse adjustment, post-stratification, raking and calibration",
   "Estimate design-based variances, design effects and effective sample sizes, and explain why iid formulas fail",
   "Carry out and document a reproducible complex-survey analysis in R"
  ],
  "workload": "1 × 90 min lecture + 1 × 90 min lab per week + ~3 h self-study",
  "software": [
   "R survey package (primary)",
   "SPSS Complex Samples (comparison)"
  ],
  "assessment": {
   "formative": "Two check blocks (weeks 6 and 10) and prediction blocks each lab",
   "final": "Reproducible survey research project on an ESS extract (weeks 13–14)"
  },
  "instructorNotes": "Steps 1–12 of the Weighting Studio are spread over weeks 1–10; each week re-opens the same instrument with a different configuration. Never present SRS formulas for cluster samples without the deff qualification. Validate all lab numbers students report against R survey before grading.",
  "units": [
   {
    "id": "s1",
    "title": {
     "en": "Week 1 · Survey inference and total survey error",
     "hu": "1. hét · Survey-következtetés és teljes survey-hiba"
    },
    "lessons": [
     {
      "id": "s1l1",
      "title": {
       "en": "Where error comes from",
       "hu": "Honnan jön a hiba"
      },
      "blocks": [
       {
        "ref": "c.tse"
       },
       {
        "ref": "ds.finite-pop"
       },
       {
        "ref": "c.population-sample"
       },
       {
        "ref": "p.representative"
       },
       {
        "ref": "l.sws-intro"
       },
       {
        "ref": "r.weighting-limits"
       }
      ]
     }
    ]
   },
   {
    "id": "s2",
    "title": {
     "en": "Week 2 · Target populations and sampling frames",
     "hu": "2. hét · Célpopuláció és mintavételi keret"
    },
    "lessons": [
     {
      "id": "s2l1",
      "title": {
       "en": "Who can be sampled",
       "hu": "Ki kerülhet mintába"
      },
      "blocks": [
       {
        "ref": "c.frames-coverage"
       },
       {
        "ref": "l.sds-frame"
       },
       {
        "ref": "c.ethics-provenance"
       }
      ]
     }
    ]
   },
   {
    "id": "s3",
    "title": {
     "en": "Week 3 · Simple random, stratified and cluster sampling",
     "hu": "3. hét · Egyszerű véletlen, rétegzett és csoportos mintavétel"
    },
    "lessons": [
     {
      "id": "s3l1",
      "title": {
       "en": "Three designs, one population",
       "hu": "Három terv, egy populáció"
      },
      "blocks": [
       {
        "ref": "c.srs-strat-cluster"
       },
       {
        "ref": "l.sampling-universe",
        "variant": {
         "config": {
          "population": "bimodal",
          "n": 50,
          "statistic": "mean"
         },
         "notes": "Use as a 10-minute warm-up before the Studio."
        }
       },
       {
        "ref": "l.sws-designs"
       },
       {
        "ref": "m.strat-variance"
       },
       {
        "ref": "con.strat-anova"
       }
      ]
     }
    ]
   },
   {
    "id": "s4",
    "title": {
     "en": "Week 4 · Multistage and PPS designs",
     "hu": "4. hét · Többlépcsős és PPS tervek"
    },
    "lessons": [
     {
      "id": "s4l1",
      "title": {
       "en": "Stages and size measures",
       "hu": "Lépcsők és méretmértékek"
      },
      "blocks": [
       {
        "ref": "c.multistage-pps"
       },
       {
        "ref": "l.sds-stages"
       },
       {
        "ref": "sw.r-survey",
        "variant": {
         "title": {
          "en": "R: declaring a design with svydesign",
          "hu": "R: terv deklarálása svydesign-nal"
         },
         "notes": "Only svydesign this week."
        }
       }
      ]
     }
    ]
   },
   {
    "id": "s5",
    "title": {
     "en": "Week 5 · Inclusion probabilities and base weights",
     "hu": "5. hét · Bekerülési valószínűségek és alapsúlyok"
    },
    "lessons": [
     {
      "id": "s5l1",
      "title": {
       "en": "π and 1/π",
       "hu": "π és 1/π"
      },
      "blocks": [
       {
        "ref": "c.inclusion-weights"
       },
       {
        "ref": "l.sws-weights"
       },
       {
        "ref": "m.ht-hajek"
       }
      ]
     }
    ]
   },
   {
    "id": "s6",
    "title": {
     "en": "Week 6 · Weighted estimation",
     "hu": "6. hét · Súlyozott becslés"
    },
    "lessons": [
     {
      "id": "s6l1",
      "title": {
       "en": "HT, Hájek and what the weight means",
       "hu": "HT, Hájek és mit jelent a súly"
      },
      "blocks": [
       {
        "ref": "l.sws-weights",
        "variant": {
         "config": {
          "design": "cluster",
          "n": 200
         },
         "notes": "Second pass: cluster design, compare HT/N with Hájek across repeats."
        }
       },
       {
        "ref": "sw.spss-complex"
       },
       {
        "ref": "a.survey-midterm"
       }
      ]
     }
    ]
   },
   {
    "id": "s7",
    "title": {
     "en": "Week 7 · Nonresponse and selection bias",
     "hu": "7. hét · Nemválaszolás és szelekciós torzítás"
    },
    "lessons": [
     {
      "id": "s7l1",
      "title": {
       "en": "Rate is not bias",
       "hu": "Az arány nem torzítás"
      },
      "blocks": [
       {
        "ref": "c.nonresponse"
       },
       {
        "ref": "l.sws-nonresponse"
       },
       {
        "ref": "p.weighting-fixes"
       },
       {
        "ref": "r.weighting-limits"
       }
      ]
     }
    ]
   },
   {
    "id": "s8",
    "title": {
     "en": "Week 8 · Post-stratification, raking and calibration",
     "hu": "8. hét · Utólagos rétegzés, raking és kalibráció"
    },
    "lessons": [
     {
      "id": "s8l1",
      "title": {
       "en": "Matching the population",
       "hu": "Illesztés a populációhoz"
      },
      "blocks": [
       {
        "ref": "c.poststrat-raking"
       },
       {
        "ref": "l.sws-adjust"
       },
       {
        "ref": "l.calibration"
       },
       {
        "ref": "c.deff-neff",
        "variant": {
         "notes": "Only the Kish n_eff part this week; deff returns in week 10."
        }
       }
      ]
     }
    ]
   },
   {
    "id": "s9",
    "title": {
     "en": "Week 9 · Questionnaire design and measurement error",
     "hu": "9. hét · Kérdőívszerkesztés és mérési hiba"
    },
    "lessons": [
     {
      "id": "s9l1",
      "title": {
       "en": "The other half of total survey error",
       "hu": "A teljes survey-hiba másik fele"
      },
      "blocks": [
       {
        "ref": "c.questionnaire"
       },
       {
        "ref": "ds.index-120"
       },
       {
        "ref": "x.attenuation"
       },
       {
        "ref": "c.reliability-validity"
       }
      ]
     }
    ]
   },
   {
    "id": "s10",
    "title": {
     "en": "Week 10 · Complex-survey variance and design effects",
     "hu": "10. hét · Komplex minták varianciája és design-hatás"
    },
    "lessons": [
     {
      "id": "s10l1",
      "title": {
       "en": "Why the iid formula fails",
       "hu": "Miért bukik az iid képlet"
      },
      "blocks": [
       {
        "ref": "c.deff-neff"
       },
       {
        "ref": "l.sws-variance"
       },
       {
        "ref": "x.ci-cluster-trap"
       },
       {
        "ref": "a.survey-variance"
       }
      ]
     }
    ]
   },
   {
    "id": "s11",
    "title": {
     "en": "Week 11 · Taylor linearization and replication",
     "hu": "11. hét · Taylor-linearizáció és replikáció"
    },
    "lessons": [
     {
      "id": "s11l1",
      "title": {
       "en": "Four standard errors for one mean",
       "hu": "Négy standard hiba egy átlagra"
      },
      "blocks": [
       {
        "ref": "c.taylor-replication"
       },
       {
        "ref": "l.csi-variance"
       },
       {
        "ref": "sw.r-survey"
       }
      ]
     }
    ]
   },
   {
    "id": "s12",
    "title": {
     "en": "Week 12 · Domain estimation and design-based testing",
     "hu": "12. hét · Résznépesség-becslés és design-alapú próbák"
    },
    "lessons": [
     {
      "id": "s12l1",
      "title": {
       "en": "Small domains, honest tests",
       "hu": "Kis résznépességek, őszinte próbák"
      },
      "blocks": [
       {
        "ref": "c.domains-testing"
       },
       {
        "ref": "l.csi-domain"
       },
       {
        "ref": "c.crosstab-percent",
        "variant": {
         "notes": "Recap from QDA2; then weighted version."
        }
       }
      ]
     }
    ]
   },
   {
    "id": "s13",
    "title": {
     "en": "Week 13 · Survey regression and missing data",
     "hu": "13. hét · Survey-regresszió és hiányzó adatok"
    },
    "lessons": [
     {
      "id": "s13l1",
      "title": {
       "en": "Models on weighted data",
       "hu": "Modellek súlyozott adaton"
      },
      "blocks": [
       {
        "ref": "c.survey-regression"
       },
       {
        "ref": "l.vra-stage2",
        "variant": {
         "notes": "Recap OLS geometry (10 min) before weighted regression."
        }
       },
       {
        "ref": "l.csi-regression"
       },
       {
        "ref": "ds.ess-extract"
       }
      ]
     }
    ]
   },
   {
    "id": "s14",
    "title": {
     "en": "Week 14 · Reproducible survey research project",
     "hu": "14. hét · Reprodukálható survey-kutatási projekt"
    },
    "lessons": [
     {
      "id": "s14l0",
      "title": {
       "en": "Sampling, Weights and Statistical Inference",
       "hu": "Mintavétel, súlyok és statisztikai következtetés"
      },
      "blocks": [
       {
        "ref": "c.inclusion-weights",
        "variant": {
         "body": "In a probability sample every unit k of the population has a known, nonzero chance of being selected: its inclusion probability πₖ. The design fixes πₖ before any data are collected; it is not estimated from the sample.\n\nThe design (base) weight is dₖ = 1/πₖ. A respondent with πₖ = 1/50 stands for 50 population units. Under simple random sampling every πₖ = n/N, so all weights are equal and weighting changes nothing. Under a disproportionate stratified design, units in oversampled strata have larger πₖ and therefore smaller weights.\n\nWeights correct for the unequal selection probabilities that the design itself created. On their own they cannot repair coverage error or nonresponse."
        }
       },
       {
        "ref": "p.representative",
        "variant": {
         "prompt": "Before you open the lab: the sample below takes the same number of people from each education group, although the tertiary group is only a fifth of the population and scores highest. Will the unweighted sample mean be above, below or close to the true population mean? Write your prediction and one reason."
        }
       },
       {
        "ref": "l.sws-weights",
        "variant": {
         "config": {
          "stage": 4,
          "design": "stratified",
          "n": 120,
          "allocation": "disproportionate"
         },
         "locked": [
          "design",
          "allocation"
         ],
         "instructions": "The design is fixed: a stratified sample of 120 with equal allocation, so the small tertiary group is oversampled. Select three sampled units from different groups and write down πₖ and dₖ = 1/πₖ for each. Then go to the Estimates stage and compare the unweighted, HT and Hájek means with Ȳ."
        }
       },
       {
        "ref": "m.ht-hajek",
        "variant": {
         "body": "The Horvitz–Thompson estimator of the population total weights each sampled value by its design weight:\n\n$$\\hat{Y}_{HT} = \\sum_{k \\in s} \\frac{y_k}{\\pi_k} = \\sum_{k \\in s} d_k\\, y_k$$\n\nDividing by the known population size N gives the HT mean. The Hájek estimator divides by the estimated population size, the sum of the weights, instead:\n\n$$\\bar{y}_{H} = \\frac{\\sum_{k \\in s} d_k\\, y_k}{\\sum_{k \\in s} d_k}$$\n\nHT is exactly unbiased over repeated samples. Hájek is a ratio: approximately unbiased in large samples and usually more stable when the number of respondents is random (cluster designs, nonresponse). With equal weights both reduce to the ordinary sample mean."
        }
       },
       {
        "ref": "rc.weighted-mean",
        "variant": {
         "config": {
          "expected": "mean ≈ 5.43 with SE ≈ 0.18 and DEff ≈ 2.4; the unweighted mean is ≈ 5.48. Values from R 4.3.3 with the survey package on the same synthetic rows."
         }
        }
       },
       {
        "ref": "a.survey-variance"
       },
       {
        "ref": "r.weighting-limits",
        "variant": {
         "prompt": "Your R output reports a design-based SE and a design effect above 2. Explain in three sentences what the design-based SE takes into account that the naive s/√n does not, and when the two would coincide."
        }
       }
      ]
     },
     {
      "id": "s14l1",
      "title": {
       "en": "Project",
       "hu": "Projekt"
      },
      "blocks": [
       {
        "ref": "c.workflow"
       },
       {
        "ref": "x.survey-project"
       }
      ]
     }
    ]
   }
  ]
 }
];
