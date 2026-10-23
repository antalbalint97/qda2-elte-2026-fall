# QDA2 — R `survey` reference values for samples drawn by the Survey Design & Weighting Studio.
#
#   node --experimental-strip-types --import ./tests/unit/register.mjs scripts/validation/studio_samples.ts
#   Rscript scripts/validation/studio_reference.R   # writes tests/unit/fixtures/studio-reference.json
#
# For every exported sample (y, final weight w, stratum, PSU, first-stage population size fpc):
#   lin    svymean SE with the weights taken as design weights, no fpc (with-replacement ultimate cluster)
#   fpc    svymean SE with a first-stage fpc (the closed forms of the studio must equal this for SRS,
#          stratified and one-stage cluster samples with full response)
#   deff   svymean(deff = "replace") on the no-fpc design (with-replacement SRS comparison, as the studio)
#   deffFpc svymean(deff = TRUE) on the fpc design
suppressPackageStartupMessages({ library(survey); library(jsonlite) })
inp <- fromJSON("tests/unit/fixtures/studio-samples.json", simplifyDataFrame = TRUE)
res <- list()
for (i in seq_len(nrow(inp$cases))) {
  cs <- inp$cases[i, ]
  d <- cs$rows[[1]]
  strat <- if (length(unique(d$stratum)) > 1) ~stratum else NULL
  ids <- if (cs$design %in% c("cluster", "twostage")) ~psu else ~1
  des <- svydesign(ids = ids, strata = strat, weights = ~w, data = d)
  desf <- svydesign(ids = ids, strata = strat, weights = ~w, fpc = ~fpc, data = d)
  m <- svymean(~y, des, deff = "replace")
  mf <- svymean(~y, desf, deff = TRUE)
  res[[cs$id]] <- list(mean = as.numeric(coef(m)), lin = as.numeric(SE(m)), fpc = as.numeric(SE(mf)), deff = as.numeric(deff(m)), deffFpc = as.numeric(deff(mf)), n = nrow(d))
}
out <- list(generator = paste0("R ", R.version$major, ".", R.version$minor, ", survey ", packageVersion("survey")), cases = res)
writeLines(toJSON(out, auto_unbox = TRUE, digits = NA), "tests/unit/fixtures/studio-reference.json")
cat("wrote", length(res), "cases\n")
