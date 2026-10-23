// Curriculum data model (concept graph → labs → learning blocks → courses → published snapshots).
// Mirrors docs/04-content-model.md and HANDOFF_V3_PRODUCTION.md §6 of the V3 design package.

export type Lang = "en" | "hu";
export interface Bilingual {
  en: string;
  hu: string;
}

/** Concept-graph domains A–K (Mathematical foundations … Measurement & research practice). */
export type DomainId = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" | "J" | "K";

export interface Concept {
  id: string;
  domain: DomainId;
  name: Bilingual;
  level: number;
  def: string;
  notation: string;
  /** Must be understood first (directed, acyclic). */
  prereq: string[];
  related: string[];
  gen?: string[];
  alt?: string[];
  /** Route (and anchor) in the original QDA2 modules that teaches this concept. */
  existing?: string;
  apps: string[];
  misconceptions: string[];
  activities: string[];
  labs: string[];
}

export type LabParamType = "enum" | "boolean" | "int" | "float" | "string" | "array" | "object" | "range";
export interface LabParam {
  key: string;
  type: LabParamType;
  options?: (string | number)[];
}
export interface LabDefinition {
  id: string;
  name: Bilingual;
  engine: string;
  concepts: string[];
  interaction: string;
  views: string[];
  outputs: string[];
  params: LabParam[];
  instructorOptions: string[];
  a11y: string[];
  components: string[];
  tests: string[];
}

export type BlockType = "concept" | "lab" | "math" | "dataset" | "prediction" | "experiment" | "r" | "assessment" | "software" | "reflection" | "connection";
export const BLOCK_TYPES: BlockType[] = ["concept", "lab", "math", "dataset", "prediction", "experiment", "r", "assessment", "software", "reflection", "connection"];

export type ReviewLevel = string;
/** Separate maturity dimensions of a block; none of them implies another. */
export interface ReviewState {
  content: ReviewLevel;
  scientific: ReviewLevel;
  numerical: ReviewLevel;
  pedagogical: ReviewLevel;
  accessibility: ReviewLevel;
  translation: ReviewLevel;
  pilot: ReviewLevel;
}

export interface DatasetProvenance {
  /** "real": an external survey the instructor downloads under its own terms (never bundled). */
  kind: "synthetic" | "authentic" | "public" | "real";
  /** null when the size depends on the external release. */
  n: number | null;
  generator: string;
  seed?: number;
  license: string;
  limits: string;
}

export interface RBlockConfig {
  code: string;
  dataset?: string;
  packages?: string[];
  editable?: boolean;
  expected?: string;
}

export interface Block {
  id: string;
  type: BlockType;
  title: Bilingual;
  version: string;
  min: number;
  lvl: number;
  concepts: string[];
  software: string[];
  objective: string;
  /** Where the content came from (repo file, prototype) — provenance, not a link. */
  src: string | null;
  lab?: string;
  config?: Record<string, unknown>;
  prompt?: string;
  /** Explicit question ids for assessment blocks (otherwise items are chosen by concept). */
  questions?: string[];
  /** Instructor-authored explanatory text (local blocks); rendered as plain text. */
  body?: string;
  provenance?: DatasetProvenance;
  datasetId?: string;
  review: ReviewState;
  /** Set when a library block was copied into a course and edited there. */
  detachedFrom?: string;
}

export interface BlockVariant {
  title?: Bilingual;
  prompt?: string;
  notes?: string;
  body?: string;
  config?: Record<string, unknown>;
  locked?: string[];
  instructions?: string;
  questions?: string[];
}
export interface BlockInstance {
  ref: string;
  /** Instance id, unique within a course (assigned by the builder; templates may omit it). */
  iid?: string;
  variant?: BlockVariant;
  /** Library version pinned at publication. */
  pin?: string;
}
export interface Lesson {
  id: string;
  title: Bilingual;
  blocks: BlockInstance[];
}
export interface Unit {
  id: string;
  title: Bilingual;
  lessons: Lesson[];
}

export interface CourseTemplate {
  id: string;
  version: string;
  state: "draft" | "published";
  lang: Lang;
  title: Bilingual;
  description: string;
  audience: string;
  prerequisites: string[];
  outcomes: string[];
  workload: string;
  software: string[];
  assessment: { formative: string; final: string };
  instructorNotes: string;
  units: Unit[];
}

export interface BankOption {
  id: string;
  label: string;
  why?: string;
  correct: boolean;
}
export interface BankQuestion {
  id: string;
  /** Concept id in the original quiz (null for items that are new in V3). */
  legacyConcept: string | null;
  concepts: string[];
  format: string;
  prompt: string;
  /** Plain-text transcription of a table or SPSS output shown with the question. */
  context?: string;
  kind: "choice" | "order";
  src: string;
  options?: BankOption[];
  correct?: string;
  items?: { id: string; label: string; why?: string }[];
  initial?: string[];
  explanation: string;
  grading: "deterministic-choice" | "deterministic-order" | "pending";
  /** Methodological review note carried from the audit. */
  flag?: string;
}

export interface DatasetColumn {
  name: string;
  type: "number" | "string" | "factor";
  label: string;
  levels?: string[];
}
export interface Dataset {
  id: string;
  title: Bilingual;
  provenance: DatasetProvenance;
  columns: DatasetColumn[];
  rows: (number | string)[][];
  design?: { strata: string; psu: string; weight: string; fpc?: Record<string, number> };
}
