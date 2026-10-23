# QDA2 — R survey reference values for the Weighting & Calibration Lab.
#
#   node --experimental-strip-types --import ./tests/unit/register.mjs scripts/validation/calibration_samples.ts
#   Rscript scripts/validation/calibration_reference.R   # writes tests/unit/fixtures/calibration-reference.json
#
# Respondents form an SRS design (ids = ~1, weights = d = N/r, no fpc). Adjustments:
#   poststrat  postStratify() on the cells of the categorical auxiliaries (age in three groups)
#   raking     calibrate(~edu + region + age, calfun = "raking")      (age in years; any subset of the three)
#   linear     calibrate(..., calfun = "linear")                       (GREG)
#   bounded    calibrate(..., calfun = "raking", bounds = c(L, U))
# For each outcome: svymean estimate and SE on the calibrated design (calibration variance), and the
# final weight vector.
suppressPackageStartupMessages({ library(survey); library(jsonlite) })
inp <- fromJSON("tests/unit/fixtures/calibration-samples.json", simplifyDataFrame = TRUE)
tot <- inp$totals
res <- list()
for (i in seq_len(nrow(inp$cases))) {
  cs <- inp$cases[i, ]
  d <- cs$rows[[1]]
  d$edu <- factor(d$edu, levels = c("prim", "sec", "ter"))
  d$region <- factor(d$region, levels = c("west", "east"))
  d$d <- cs$d
  des <- svydesign(ids = ~1, weights = ~d, data = d)
  d$ageG <- factor(d$ageG, levels = c("18-34", "35-54", "55+"))
  aux <- unlist(cs$aux)
  if (cs$method == "poststrat") {
    vars <- c(edu = "edu", region = "region", age = "ageG")[aux]
    pp <- as.data.frame(tot$people)
    pp$edu <- factor(pp$edu, levels = levels(d$edu)); pp$region <- factor(pp$region, levels = levels(d$region)); pp$ageG <- factor(pp$ageG, levels = levels(d$ageG))
    d$cell <- interaction(d[, vars], drop = FALSE)
    pp$cell <- interaction(pp[, vars], drop = FALSE)
    pt <- as.data.frame(table(cell = pp$cell))
    pt <- pt[pt$Freq > 0, ]
    des <- svydesign(ids = ~1, weights = ~d, data = d)
    cal <- postStratify(des, ~cell, pt)
  } else {
    terms <- c(edu = "edu", region = "region", age = "age")[aux]
    f <- as.formula(paste("~", paste(terms, collapse = " + ")))
    pv <- c(`(Intercept)` = tot$N)
    if ("edu" %in% aux) pv <- c(pv, edusec = tot$edu$sec, eduter = tot$edu$ter)
    if ("region" %in% aux) pv <- c(pv, regioneast = tot$region$east)
    if ("age" %in% aux) pv <- c(pv, age = tot$age)
    if (cs$method == "linear") cal <- calibrate(des, f, pv, calfun = "linear")
    else if (cs$method == "raking") cal <- calibrate(des, f, pv, calfun = "raking", epsilon = 1e-10, maxit = 100)
    else cal <- calibrate(des, f, pv, calfun = "raking", bounds = unlist(cs$bounds), epsilon = 1e-10, maxit = 100)
  }
  est <- list()
  for (y in c("trust", "online", "life")) {
    m <- svymean(as.formula(paste0("~", y)), cal)
    est[[y]] <- list(mean = as.numeric(coef(m)), se = as.numeric(SE(m)))
  }
  res[[cs$id]] <- list(weights = as.numeric(weights(cal)), est = est)
}
out <- list(generator = paste0("R ", R.version$major, ".", R.version$minor, ", survey ", packageVersion("survey")), cases = res)
writeLines(toJSON(out, auto_unbox = TRUE, digits = NA), "tests/unit/fixtures/calibration-reference.json")
cat("wrote", length(res), "cases\n")
