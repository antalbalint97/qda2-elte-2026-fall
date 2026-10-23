"use client";

// State hook shared by every lab: parameters (validated against LabDefinition.params), language, teach
// mode, instructor locks and instructions, reset-to-preset and share-by-link.
//
// Standalone (/lab/[id]) the configuration comes from the URL hash and Share writes it back. Embedded in a
// lesson the configuration comes from the published snapshot (`config` prop) and the hash is left alone.
import { LABS } from "@/content/curriculum/labs";
import type { Lang, LabDefinition } from "@/content/curriculum/types";
import { decodeJsonHash, encodeJsonHash, sanitizeConfig, type LabConfiguration } from "@/lib/lab-config";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { common, type CommonStrings } from "./i18n";

export interface LabProps {
  /** Configuration from a lesson snapshot or the Course Builder preview. When set, the URL hash is not used. */
  config?: LabConfiguration;
  /** Rendered inside a lesson: no page-level h1, compact chrome. */
  embedded?: boolean;
}

export interface HashCodec<P> {
  /** Returns params (and shell keys) from a non-JSON hash, or null to fall back to the JSON contract. */
  read(hash: string): { params: Partial<P>; l?: Lang; present?: boolean } | null;
  write(params: P, lang: Lang, present: boolean): string;
}

export interface LabApi<P extends Record<string, unknown>> {
  id: string;
  def: LabDefinition;
  params: P;
  set: <K extends keyof P>(key: K, value: P[K]) => void;
  setMany: (patch: Partial<P>) => void;
  lang: Lang;
  setLang: (l: Lang) => void;
  t: CommonStrings;
  present: boolean;
  setPresent: (on: boolean) => void;
  locked: (key: keyof P & string) => boolean;
  lockedKeys: string[];
  instructions: string;
  rejected: string[];
  embedded: boolean;
  /** Increments on every reset; labs use it to clear local (non-param) state. */
  resetCount: number;
  reset: () => void;
  share: () => Promise<"copied" | "manual">;
  shareUrl: () => string;
}

export function labDefinition(id: string): LabDefinition {
  const def = LABS.find((l) => l.id === id);
  if (!def) throw new Error(`Unknown lab ${id}`);
  return def;
}

interface Initial<P> {
  params: P;
  lang: Lang;
  present: boolean;
  locked: string[];
  instructions: string;
  rejected: string[];
}

function resolve<P extends Record<string, unknown>>(
  def: LabDefinition,
  defaults: P,
  raw: LabConfiguration | Record<string, unknown> | null,
  normalize: (p: P) => P,
): Initial<P> {
  const { config, rejected } = sanitizeConfig(raw as Record<string, unknown> | null, def.params);
  const params = { ...defaults };
  for (const k of Object.keys(defaults)) if (k in config) (params as Record<string, unknown>)[k] = config[k];
  // Declared params the lab does not implement are ignored silently (they are not errors in the link).
  return {
    params: normalize(params),
    lang: config.l ?? "en",
    present: config.present ?? false,
    locked: config.controls?.locked ?? [],
    instructions: config.instructions ?? "",
    rejected,
  };
}

export function useLab<P extends Record<string, unknown>>(
  id: string,
  defaults: P,
  { config, embedded = false, normalize = (p: P) => p, codec }: LabProps & { normalize?: (p: P) => P; codec?: HashCodec<P> } = {},
): LabApi<P> {
  const def = useMemo(() => labDefinition(id), [id]);
  const normRef = useRef(normalize);
  normRef.current = normalize;
  const defaultsRef = useRef(defaults);
  const usesHash = !config && !embedded;

  const first = useMemo(() => resolve(def, defaults, config ?? null, normalize), [def, config]); // eslint-disable-line react-hooks/exhaustive-deps
  const [initial, setInitial] = useState<Initial<P>>(first);
  const [params, setParams] = useState<P>(first.params);
  const [lang, setLang] = useState<Lang>(first.lang);
  const [present, setPresent] = useState(first.present);
  const [resetCount, setResetCount] = useState(0);

  // A new snapshot config (Builder preview edits) replaces the starting point.
  useEffect(() => {
    if (!config) return;
    setInitial(first);
    setParams(first.params);
    setLang(first.lang);
  }, [config, first]);

  // Standalone: read the hash after mount (the server render uses the defaults) and on hashchange.
  useEffect(() => {
    if (!usesHash) return;
    const load = () => {
      const hash = window.location.hash;
      const legacy = codec?.read(hash);
      let next: Initial<P>;
      if (legacy) {
        const base = resolve(def, defaultsRef.current, null, normRef.current);
        next = { ...base, params: normRef.current({ ...base.params, ...legacy.params }), lang: legacy.l ?? "en", present: legacy.present ?? false };
      } else {
        const raw = decodeJsonHash(hash);
        if (!raw && hash.length > 1) {
          next = { ...resolve(def, defaultsRef.current, null, normRef.current), rejected: ["#"] };
        } else next = resolve(def, defaultsRef.current, raw, normRef.current);
      }
      setInitial(next);
      setParams(next.params);
      setLang(next.lang);
      setPresent(next.present);
    };
    load();
    window.addEventListener("hashchange", load);
    return () => window.removeEventListener("hashchange", load);
  }, [usesHash, def, codec]);

  // Teach mode: Escape leaves it.
  useEffect(() => {
    if (!present) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPresent(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [present]);

  const locked = useCallback((key: string) => initial.locked.includes(key), [initial.locked]);

  const setMany = useCallback(
    (patch: Partial<P>) => {
      setParams((p) => {
        const allowed = Object.fromEntries(Object.entries(patch).filter(([k]) => !initial.locked.includes(k)));
        return normRef.current({ ...p, ...allowed });
      });
    },
    [initial.locked],
  );
  const set = useCallback(<K extends keyof P>(key: K, value: P[K]) => setMany({ [key]: value } as unknown as Partial<P>), [setMany]);

  const reset = useCallback(() => {
    setParams(initial.params);
    setResetCount((c) => c + 1);
  }, [initial.params]);

  const hashFor = useCallback(() => {
    if (codec) return codec.write(params, lang, present);
    const cfg: LabConfiguration = { l: lang, ...params };
    if (initial.locked.length) cfg.controls = { locked: initial.locked };
    if (initial.instructions) cfg.instructions = initial.instructions;
    if (present) cfg.present = true;
    return encodeJsonHash(cfg);
  }, [codec, params, lang, present, initial.locked, initial.instructions]);

  const shareUrl = useCallback(() => {
    const base = typeof window === "undefined" ? `/lab/${id}` : `${window.location.origin}/lab/${id}`;
    return base + hashFor();
  }, [id, hashFor]);

  const share = useCallback(async (): Promise<"copied" | "manual"> => {
    const url = shareUrl();
    if (usesHash) {
      try {
        window.history.replaceState(null, "", hashFor());
      } catch {
        /* ignore */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      return "copied";
    } catch {
      return "manual";
    }
  }, [shareUrl, hashFor, usesHash]);

  return {
    id,
    def,
    params,
    set,
    setMany,
    lang,
    setLang,
    t: common(lang),
    present,
    setPresent,
    locked,
    lockedKeys: initial.locked,
    instructions: initial.instructions,
    rejected: initial.rejected,
    embedded,
    resetCount,
    reset,
    share,
    shareUrl,
  };
}
