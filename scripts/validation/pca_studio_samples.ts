// Writes tests/unit/fixtures/pca-studio-samples.json: the data the Linear Algebra & PCA Studio analyses (probe
// clouds, the course item matrices, k-means blobs with the lab's seeded starting centroids).
// scripts/validation/pca_studio_reference.py adds numpy / scikit-learn / factor_analyzer results;
// tests/unit/pca-studio.test.ts compares.
//   node --experimental-strip-types --import ./tests/unit/register.mjs scripts/validation/pca_studio_samples.ts
import { writeFileSync } from "node:fs";
import { itemCols, makeBlobs, makeCloud, runKmeans } from "../../src/components/lab/labs/linalg-pca-studio/model";

const clouds = [
  { seed: 2026, rho: 0.7 },
  { seed: 11, rho: -0.4 },
  { seed: 5, rho: 0 },
].map((c) => ({ id: `cloud-${c.seed}-${c.rho}`, ...c, ...makeCloud(c.seed, c.rho) }));
const items = [
  { id: "efficacy-keyed", ...itemCols("efficacy", true) },
  { id: "efficacy-raw", ...itemCols("efficacy", false) },
  { id: "trust-keyed", ...itemCols("trust", true) },
].map(({ id, cols }) => ({ id, cols }));
const km = [2, 3, 4, 5].flatMap((k) =>
  [2026, 9].map((seed) => {
    const points = makeBlobs(seed);
    const r = runKmeans(points, k, seed);
    return { id: `kmeans-k${k}-s${seed}`, k, seed, points, init: r?.steps[0].centroids };
  }),
);
writeFileSync(new URL("../../tests/unit/fixtures/pca-studio-samples.json", import.meta.url), JSON.stringify({ generator: "scripts/validation/pca_studio_samples.ts", clouds, items, kmeans: km }) + "\n");
console.log("wrote", clouds.length, items.length, km.length);
