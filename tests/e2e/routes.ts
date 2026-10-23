/** Every public route. Deep links into these pages must keep working. */
export const MODULE_ROUTES = ["/measurement", "/crosstabs", "/lazarsfeld", "/p-values", "/correlation", "/t-tests", "/anova", "/variance", "/indices"];
export const ROUTES = ["/", ...MODULE_ROUTES, "/review", "/go-further", "/bonus/sopranos", "/about", "/privacy"];

/** V3 laboratories integrated so far (src/content/curriculum/implemented-labs.ts) and the portfolio. */
export const LAB_ROUTES = ["/labs", "/lab/vra-lab", "/lab/sampling-universe", "/lab/ttest-lab", "/lab/ci-explorer", "/lab/survey-weighting-studio", "/lab/hypothesis-lab", "/lab/distribution-studio", "/lab/probability-playground", "/lab/expected-value-lab", "/lab/categorical-lab", "/lab/corr-reg-lab", "/lab/lazarsfeld-simpson-lab", "/lab/anova-studio"];
