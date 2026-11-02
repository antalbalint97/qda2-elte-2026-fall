/** Published classroom SPSS values transcribed from QA2_5_composite_variables_v05, pp. 10–16.
 * Intermediate 4-item output was not supplied. Do not invent it. */
export const INITIAL = [
  { id: "V40", name: "International companies damage local business", communality: .278 },
  { id: "V41", name: "Free trade leads to better products", communality: .284 },
  { id: "V42", name: "Follow international organisations' decisions", communality: .456 },
  { id: "V43", name: "International organisations take too much power", communality: .232 },
  { id: "V44", name: "Citizen of the world", communality: .259 },
] as const;
export const FINAL = [
  { id: "V41", name: "Free trade leads to better products", communality: .416, loading: .645 },
  { id: "V42", name: "Follow international organisations' decisions", communality: .623, loading: .790 },
  { id: "V44", name: "Citizen of the world", communality: .392, loading: .626 },
] as const;
export const EIGENVALUES = [1.431, .902, .667] as const;
export const VARIANCE = [47.694, 30.065, 22.241] as const;
