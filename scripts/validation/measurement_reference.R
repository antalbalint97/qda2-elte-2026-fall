# QDA2 — base-R reference values for the Measurement & Index Lab (Cronbach's α in covariance form).
#   node --experimental-strip-types --import ./tests/unit/register.mjs scripts/validation/measurement_samples.ts
#   Rscript scripts/validation/measurement_reference.R   # writes tests/unit/fixtures/measurement-reference.json
suppressPackageStartupMessages(library(jsonlite))
inp <- fromJSON("tests/unit/fixtures/measurement-items.json", simplifyVector = TRUE)
alpha <- function(X) { C <- cov(X); k <- ncol(X); k / (k - 1) * (1 - sum(diag(C)) / sum(C)) }
res <- list()
for (i in seq_len(nrow(inp$cases))) {
  X <- t(inp$cases$items[[i]])
  res[[inp$cases$id[i]]] <- list(
    alpha = alpha(X),
    alphaIfDeleted = sapply(seq_len(ncol(X)), function(j) alpha(X[, -j, drop = FALSE])),
    corrected = sapply(seq_len(ncol(X)), function(j) cor(X[, j], rowSums(X[, -j, drop = FALSE]))),
    standardized = { R <- cor(X); k <- ncol(X); rbar <- (sum(R) - k) / (k * (k - 1)); k * rbar / (1 + (k - 1) * rbar) }
  )
}
writeLines(toJSON(list(generator = paste0("R ", R.version$major, ".", R.version$minor, " (base)"), cases = res), auto_unbox = TRUE, digits = NA), "tests/unit/fixtures/measurement-reference.json")
cat("wrote", length(res), "cases\n")
