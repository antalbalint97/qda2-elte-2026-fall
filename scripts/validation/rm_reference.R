# QDA2 — base-R reference for the one-way repeated-measures ANOVA (engine regression.ts `rmAnova`).
#
#   Rscript scripts/validation/rm_reference.R   # writes tests/unit/fixtures/rm-reference.json
#
# Each case: subjects × conditions scores. F and p from aov(y ~ cond + Error(subj/cond)); the
# Greenhouse–Geisser epsilon and corrected p from anova.mlm(..., X = ~1, test = "Spherical").
suppressPackageStartupMessages(library(jsonlite))
set.seed(20261023)
mk <- function(n, k, eff, subjSd, errSd, hetero = FALSE) {
  s <- rnorm(n, 0, subjSd)
  m <- sapply(seq_len(k), function(j) 50 + eff[j] + s + rnorm(n, 0, errSd * (if (hetero) j else 1)))
  round(m, 1)
}
cases <- list(
  a = mk(8, 3, c(0, 3, 6), 8, 4),
  b = mk(12, 4, c(0, 1, 1, 2), 5, 6, hetero = TRUE),
  c = mk(6, 5, c(0, 4, 2, 7, 5), 10, 3),
  d = mk(10, 2, c(0, 2.5), 6, 5)
)
res <- list()
for (nm in names(cases)) {
  Y <- cases[[nm]]
  n <- nrow(Y); k <- ncol(Y)
  long <- data.frame(y = as.vector(Y), subj = factor(rep(seq_len(n), k)), cond = factor(rep(seq_len(k), each = n)))
  a <- summary(aov(y ~ cond + Error(subj / cond), data = long))
  w <- a[["Error: subj:cond"]][[1]]
  s <- a[["Error: subj"]][[1]]
  out <- list(data = Y, F = w[["F value"]][1], p = w[["Pr(>F)"]][1], ssCond = w[["Sum Sq"]][1], ssErr = w[["Sum Sq"]][2], ssSubj = s[["Sum Sq"]][1], dfErr = w[["Df"]][2])
  if (k > 2) {
    sph <- anova(lm(Y ~ 1), X = ~1, test = "Spherical")
    out$pGG <- sph[1, "G-G Pr"]
  }
  res[[nm]] <- out
}
writeLines(toJSON(list(generator = paste0("R ", R.version$major, ".", R.version$minor, " (stats::aov, anova.mlm)"), cases = res), auto_unbox = TRUE, digits = NA), "tests/unit/fixtures/rm-reference.json")
cat("wrote", length(res), "cases\n")
