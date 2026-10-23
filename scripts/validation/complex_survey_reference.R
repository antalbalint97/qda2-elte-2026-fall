# QDA2 — R survey reference values for the Complex Survey Inference Lab.
#
#   node --experimental-strip-types --import ./tests/unit/register.mjs scripts/validation/complex_survey_samples.ts
#   Rscript scripts/validation/complex_survey_reference.R   # writes tests/unit/fixtures/complex-survey-reference.json
#
# Design: svydesign(ids = ~psu, strata = ~stratum, weights = ~w [, fpc = ~fpc]). For every sample:
# svymean SE without and with fpc and deff; JK1 (strata not declared), JKn (and BRR with two PSUs per stratum) via as.svrepdesign;
# domain mean of group C (subset) with Taylor and JKn SE; svychisq(~group + agree) first-order ("Chisq")
# and second-order ("F"); svyglm(y ~ x + group) coefficients and SEs.
suppressPackageStartupMessages({ library(survey); library(jsonlite) })
inp <- fromJSON("tests/unit/fixtures/complex-survey-samples.json", simplifyDataFrame = TRUE)
res <- list()
for (i in seq_len(nrow(inp$cases))) {
  cs <- inp$cases[i, ]
  d <- cs$rows[[1]]
  d$group <- factor(d$group, levels = c("A", "B", "C"))
  des <- svydesign(ids = ~psu, strata = ~stratum, weights = ~w, data = d)
  desf <- svydesign(ids = ~psu, strata = ~stratum, weights = ~w, fpc = ~fpc, data = d)
  m <- svymean(~y, des, deff = TRUE)
  mf <- svymean(~y, desf)
  jk1 <- as.svrepdesign(svydesign(ids = ~psu, weights = ~w, data = d), type = "JK1")   # R refuses JK1 for a stratified design
  jkn <- as.svrepdesign(des, type = "JKn")
  out <- list(mean = as.numeric(coef(m)), se = as.numeric(SE(m)), seFpc = as.numeric(SE(mf)), deff = as.numeric(deff(m)),
              jk1 = as.numeric(SE(svymean(~y, jk1))), jkn = as.numeric(SE(svymean(~y, jkn))))
  if (cs$a == 2) out$brr <- as.numeric(SE(svymean(~y, as.svrepdesign(des, type = "BRR"))))
  dm <- svymean(~y, subset(des, group == "C"))
  out$domainC <- list(mean = as.numeric(coef(dm)), se = as.numeric(SE(dm)), jkn = as.numeric(SE(svymean(~y, subset(jkn, group == "C")))))
  c1 <- svychisq(~group + agree, des, statistic = "Chisq")
  c2 <- svychisq(~group + agree, des)
  out$chisq <- list(X2 = as.numeric(c1$statistic), p = as.numeric(c1$p.value), F = as.numeric(c2$statistic), ndf = as.numeric(c2$parameter[1]), ddf = as.numeric(c2$parameter[2]), Fp = as.numeric(c2$p.value))
  g <- svyglm(y ~ x + group, design = des)
  out$glm <- list(coef = as.numeric(coef(g)), se = as.numeric(SE(g)))
  res[[cs$id]] <- out
}
writeLines(toJSON(list(generator = paste0("R ", R.version$major, ".", R.version$minor, ", survey ", packageVersion("survey")), cases = res), auto_unbox = TRUE, digits = NA), "tests/unit/fixtures/complex-survey-reference.json")
cat("wrote", length(res), "cases\n")
