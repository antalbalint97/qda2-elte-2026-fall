# Reference values for the Mathematical Foundations Studio (tests/unit/math-studio.test.ts):
# OLS on the VRA base data (ds.news-knowledge), integrate() of the preset functions, D() derivatives,
# and optimize() of the binomial log-likelihood.
#   Rscript scripts/validation/math_reference.R
library(jsonlite)
x <- c(1, 2, 3, 4, 6, 3, 5, 6, 8, 9, 5, 7, 9, 11, 13)
y <- c(28, 35, 31, 44, 49, 46, 52, 58, 55, 66, 60, 71, 68, 82, 88)
m <- lm(y ~ x)
fns <- list(quad = function(u) u^2, exp = exp, log = log, sin = sin, abs = abs, normal = dnorm)
exprs <- list(quad = quote(u^2), exp = quote(exp(u)), log = quote(log(u)), sin = quote(sin(u)), normal = quote(exp(-u^2 / 2) / sqrt(2 * pi)))
cases <- list(
  list(fn = "quad", a = 1, b = 1, c = 0, d = 0, lo = -1, hi = 2, x0 = 1),
  list(fn = "quad", a = -0.5, b = 2, c = 1, d = 3, lo = -2, hi = 1, x0 = -0.3),
  list(fn = "exp", a = 1, b = 1, c = 0, d = 0, lo = -1, hi = 1, x0 = 0.5),
  list(fn = "exp", a = 2, b = -0.5, c = 0.2, d = -1, lo = -3, hi = 2, x0 = 1.7),
  list(fn = "log", a = 1, b = 1, c = 0, d = 0, lo = 0.5, hi = 3, x0 = 2),
  list(fn = "log", a = 1.5, b = 2, c = 1, d = 0.5, lo = 0, hi = 2, x0 = 0.25),
  list(fn = "sin", a = 1, b = 1, c = 0, d = 0, lo = 0, hi = pi, x0 = 1),
  list(fn = "sin", a = 2, b = 3, c = -1, d = 0, lo = -1, hi = 2.5, x0 = -0.8),
  list(fn = "abs", a = 1, b = 1, c = 0, d = 0, lo = -1, hi = 2, x0 = 0.7),
  list(fn = "normal", a = 1, b = 1, c = 0, d = 0, lo = -1.96, hi = 1.96, x0 = 1),
  list(fn = "normal", a = 3, b = 0.5, c = -1, d = 0.2, lo = -2, hi = 4, x0 = 2.5)
)
out_cases <- lapply(cases, function(k) {
  f <- fns[[k$fn]]
  g <- function(x) k$a * f(k$b * x + k$c) + k$d
  # analytic derivative from D() where available (abs: sign away from the kink)
  dg <- if (k$fn == "abs") k$a * k$b * sign(k$b * k$x0 + k$c) else {
    e <- D(exprs[[k$fn]], "u"); u <- k$b * k$x0 + k$c; k$a * k$b * eval(e, list(u = u))
  }
  c(k, list(integral = integrate(g, k$lo, k$hi, rel.tol = 1e-12)$value, deriv = dg))
})
lik <- lapply(list(c(7, 10), c(1, 20), c(45, 60)), function(kn) {
  ll <- function(p) kn[1] * log(p) + (kn[2] - kn[1]) * log(1 - p)
  o <- optimize(ll, c(1e-9, 1 - 1e-9), maximum = TRUE, tol = 1e-12)
  list(k = kn[1], n = kn[2], argmax = o$maximum, L = dbinom(kn[1], kn[2], 0.5))
})
write_json(list(
  ols = list(a = unname(coef(m)[1]), b = unname(coef(m)[2]), sse = sum(resid(m)^2)),
  cases = out_cases, likelihood = lik
), "tests/unit/fixtures/math-reference.json", digits = NA, auto_unbox = TRUE)
cat("wrote math-reference.json\n")
