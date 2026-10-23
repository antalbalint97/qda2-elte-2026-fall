# QDA2 — survey engine reference values from R `survey` (and `sampling`).
#
#   Rscript scripts/validation/survey_reference.R      # writes tests/unit/fixtures/survey-reference.json
#
# Needs R ≥ 4.1 with the packages survey, sampling and jsonlite (Debian/Ubuntu: r-cran-survey r-cran-sampling
# r-cran-jsonlite). tests/unit/survey.test.ts compares src/lib/engine/survey-*.ts with this file.
# Conventions (kept identical on both sides, otherwise values are not comparable):
#   * svydesign(..., fpc = ~N): finite-population correction at the FIRST stage ("with fpc" fixtures)
#   * svydesign without fpc: with-replacement ultimate-cluster approximation ("without fpc" fixtures)
#   * svymean = Hájek (ratio) mean with Taylor linearisation
#   * JKn via as.svrepdesign(type = "JKn")
#   * rake() is run to convergence (epsilon 1e-10) so the weight vectors can be compared exactly
#   * svychisq: statistic = "Chisq" (first-order Rao–Scott) and "F" (second-order Rao–Scott)
#   F1–F10 mirror the closed-form fixtures of the V3 package (scripts/validation/survey_fixtures.js there).
suppressPackageStartupMessages({ library(survey); library(sampling); library(jsonlite) })
out <- list(generator = paste0("R ", R.version$major, ".", R.version$minor, ", survey ", packageVersion("survey"), ", sampling ", packageVersion("sampling")))

# ── closed-form fixtures F1–F10 ─────────────────────────────────────────────────
d1 <- data.frame(y = c(2, 4, 6, 8), w = 2.5, N = 10)
des1f <- svydesign(ids = ~1, weights = ~w, fpc = ~N, data = d1)
des1 <- svydesign(ids = ~1, weights = ~w, data = d1)
out$F1a <- as.numeric(coef(svymean(~y, des1)))
out$F1b <- as.numeric(SE(svymean(~y, des1f)))^2
out$F1c <- as.numeric(SE(svymean(~y, des1)))^2
d2 <- data.frame(y = c(1, 3, 10, 14), w = c(3, 3, 2, 2), h = c("A", "A", "B", "B"), N = c(6, 6, 4, 4))
des2f <- svydesign(ids = ~1, strata = ~h, weights = ~w, fpc = ~N, data = d2)
des2 <- svydesign(ids = ~1, strata = ~h, weights = ~w, data = d2)
out$F2a <- as.numeric(coef(svymean(~y, des2)))
out$F2b <- as.numeric(SE(svymean(~y, des2f)))^2
out$F2c <- as.numeric(SE(svymean(~y, des2)))^2
out$F2e <- as.numeric(SE(svymean(~y, as.svrepdesign(des2, type = "JKn"))))^2
d3 <- data.frame(y = c(1, 2, 3, 5, 6, 7), w = 2, psu = rep(1:2, each = 3), A = 4)
des3 <- svydesign(ids = ~psu, weights = ~w, data = d3)
des3f <- svydesign(ids = ~psu, weights = ~w, fpc = ~A, data = d3)
out$F3a <- as.numeric(coef(svymean(~y, des3)))
out$F3b <- as.numeric(SE(svymean(~y, des3)))^2
out$F3c <- as.numeric(SE(svymean(~y, des3f)))^2
w4 <- c(1, 1, 3, 3)
out$F4a <- length(w4) * sum(w4^2) / sum(w4)^2
out$F4b <- sum(w4)^2 / sum(w4^2)
d5 <- data.frame(y = c(1, 2, 3), w = 1, g = c("a", "a", "b"))
ps <- postStratify(svydesign(ids = ~1, weights = ~w, data = d5), ~g, data.frame(g = c("a", "b"), Freq = c(10, 5)))
out$F5 <- sum(weights(ps)[d5$g == "a"])
d7 <- data.frame(y = 0, x = 1:4, w = 2)
cal7 <- calibrate(svydesign(ids = ~1, weights = ~w, data = d7), ~x, c(`(Intercept)` = 10, x = 100), calfun = "linear")
out$F7 <- sum(weights(cal7) * d7$x)
out$F7weights <- as.numeric(weights(cal7))
byA <- svyby(~y, ~h, des2f, svymean)
out$F8 <- as.numeric(SE(byA))[byA$h == "A"]^2
out$F9 <- 60 * (100 * 10) / (100 * 10 + 200 * 5)
out$F10 <- as.numeric(sampling::inclusionprobabilities(c(1, 2, 3, 4, 50), 3))
out$F10b <- as.numeric(sampling::inclusionprobabilities(c(5, 1, 8, 2, 30, 4, 12), 4))

# ── a stratified two-stage synthetic survey (data exported for the TypeScript side) ──
set.seed(20261023)
H <- 3; P <- 4; m <- 6
dat <- expand.grid(k = 1:m, psu = 1:P, h = 1:H)
dat$psu_id <- (dat$h - 1) * P + dat$psu
dat$id <- seq_len(nrow(dat))
u <- rnorm(H * P)[dat$psu_id]
dat$y <- round(50 + 5 * dat$h + 4 * u + rnorm(nrow(dat), 0, 8), 1)
dat$a <- ifelse(runif(nrow(dat)) < plogis(-0.3 + 0.2 * dat$h + 0.5 * u), "yes", "no")
dat$b <- sample(c("low", "mid", "high"), nrow(dat), TRUE)
dat$x <- round(rnorm(nrow(dat), 10, 3), 2)
dat$w <- round(c(20, 35, 50)[dat$h] * runif(nrow(dat), 0.8, 1.25), 2)
dat$Npsu <- c(10, 12, 15)[dat$h]
dat$Mpsu <- 20
out$data <- dat[, c("id", "h", "psu_id", "y", "a", "b", "x", "w", "Npsu", "Mpsu")]

des <- svydesign(ids = ~psu_id, strata = ~h, weights = ~w, data = dat)
desf <- svydesign(ids = ~psu_id, strata = ~h, weights = ~w, fpc = ~Npsu, data = dat)
m1 <- svymean(~y, des, deff = TRUE)
out$mean <- list(est = as.numeric(coef(m1)), se = as.numeric(SE(m1)), deffR = as.numeric(deff(m1)), df = degf(des))
out$meanFpc <- list(est = as.numeric(coef(svymean(~y, desf))), se = as.numeric(SE(svymean(~y, desf))))
out$total <- list(est = as.numeric(coef(svytotal(~y, des))), se = as.numeric(SE(svytotal(~y, des))))
dom <- svyby(~y, ~a, des, svymean)
out$domain <- list(levels = as.character(dom$a), est = as.numeric(coef(dom)), se = as.numeric(SE(dom)))
out$jkn <- list(se = as.numeric(SE(svymean(~y, as.svrepdesign(des, type = "JKn")))))
out$jk1 <- list(se = as.numeric(SE(svymean(~y, as.svrepdesign(svydesign(ids = ~psu_id, weights = ~w, data = dat), type = "JK1")))))
cs1 <- svychisq(~a + b, des, statistic = "Chisq")
cs2 <- svychisq(~a + b, des, statistic = "F")
out$raoScott <- list(pearson = as.numeric(cs1$statistic), chisqP = as.numeric(cs1$p.value), Fstat = as.numeric(cs2$statistic), ndf = as.numeric(cs2$parameter[1]), ddf = as.numeric(cs2$parameter[2]), Fp = as.numeric(cs2$p.value))
g <- svyglm(y ~ x, des)
out$svyglm <- list(coef = as.numeric(coef(g)), se = as.numeric(SE(g)))
popA <- data.frame(a = c("no", "yes"), Freq = c(1500, 1300))
popB <- data.frame(b = c("high", "low", "mid"), Freq = c(800, 1100, 900))
rk <- rake(des, list(~a, ~b), list(popA, popB), control = list(maxit = 200, epsilon = 1e-10, verbose = FALSE))
out$rake <- list(weights = as.numeric(weights(rk)), mean = as.numeric(coef(svymean(~y, rk))), se = as.numeric(SE(svymean(~y, rk))))
lin <- calibrate(des, ~a + b, population = c(`(Intercept)` = 2800, ayes = 1300, blow = 1100, bmid = 900), calfun = "linear")
out$greg <- list(weights = as.numeric(weights(lin)), mean = as.numeric(coef(svymean(~y, lin))), se = as.numeric(SE(svymean(~y, lin))))
bnd <- tryCatch(calibrate(des, ~a + b, population = c(`(Intercept)` = 2800, ayes = 1300, blow = 1100, bmid = 900), calfun = "raking", bounds = c(0.5, 2)), error = function(e) NULL)
out$rakeBounded <- if (is.null(bnd)) list(error = "calibrate(bounds) did not converge") else list(weights = as.numeric(weights(bnd)))
# two-stage with FPC at both stages — the engine shows the ultimate-cluster approximation instead (gated in the UI)
des2s <- svydesign(ids = ~psu_id + id, strata = ~h, fpc = ~Npsu + Mpsu, weights = ~w, data = dat)
out$twoStage <- list(se = as.numeric(SE(svymean(~y, des2s))))

path <- "tests/unit/fixtures/survey-reference.json"
writeLines(toJSON(out, auto_unbox = TRUE, digits = NA, pretty = TRUE, dataframe = "rows"), path)
cat("wrote", path, "\n")
