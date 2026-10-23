# QDA2 — R reference values for the Survey Sampling Design Studio.
#
#   node --experimental-strip-types --import ./tests/unit/register.mjs scripts/validation/design_studio_samples.ts
#   Rscript scripts/validation/design_studio_reference.R   # writes tests/unit/fixtures/design-studio-reference.json
#
# For every exported sample: svymean of y with ids = ~psu, strata = ~stratum (when stratified), weights = ~w,
# and fpc = ~fpc for one-stage designs (two-stage designs use the with-replacement ultimate-cluster
# approximation, as the studio); svyby(~y, ~h, svymean) for the settlement-type domains. For every PSU size vector: sampling::inclusionprobabilities(x, n).
suppressPackageStartupMessages({ library(survey); library(sampling); library(jsonlite) })
inp <- fromJSON("tests/unit/fixtures/design-studio-samples.json", simplifyDataFrame = TRUE)
res <- list()
for (i in seq_len(nrow(inp$cases))) {
  cs <- inp$cases[i, ]
  d <- cs$rows[[1]]
  strat <- if (cs$strata > 1) ~stratum else NULL
  des <- if (cs$stages == 1) svydesign(ids = ~psu, strata = strat, weights = ~w, fpc = ~fpc, data = d) else svydesign(ids = ~psu, strata = strat, weights = ~w, data = d)
  m <- svymean(~y, des)
  dm <- svyby(~y, ~h, des, svymean)
  res[[cs$id]] <- list(mean = as.numeric(coef(m)), se = as.numeric(SE(m)), n = nrow(d), domainMean = as.numeric(coef(dm)), domainSe = as.numeric(SE(dm)))
}
pps <- list()
for (i in seq_len(nrow(inp$pps))) {
  r <- inp$pps[i, ]
  pps[[r$id]] <- as.numeric(inclusionprobabilities(unlist(r$x), r$n))
}
out <- list(generator = paste0("R ", R.version$major, ".", R.version$minor, ", survey ", packageVersion("survey"), ", sampling ", packageVersion("sampling")), cases = res, pps = pps)
writeLines(toJSON(out, auto_unbox = TRUE, digits = NA), "tests/unit/fixtures/design-studio-reference.json")
cat("wrote", length(res), "cases and", length(pps), "PPS vectors\n")
