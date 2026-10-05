"use client";

import { useSyncExternalStore } from "react";
import type { ConceptId } from "@/content/concepts";

const KEY = "qda2-lab-progress-v1";

export interface AnswerRecord {
  concept: ConceptId;
  correct: boolean; // result of the first attempt
  attempts: number;
  at: number;
}

export interface ProgressState {
  answers: Record<string, AnswerRecord>;
  streak: number;
  bestStreak: number;
  selfRatings: Record<string, "review" | "ok">;
}

const EMPTY: ProgressState = { answers: {}, streak: 0, bestStreak: 0, selfRatings: {} };

let state: ProgressState = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) state = { ...EMPTY, ...JSON.parse(raw) };
  } catch {
    state = EMPTY;
  }
}

function save() {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // storage may be unavailable (private mode); progress then lives for this page view only
  }
}

function emit(next: ProgressState) {
  state = next;
  save();
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  load();
  listeners.add(l);
  return () => listeners.delete(l);
}

function getSnapshot() {
  load();
  return state;
}

function getServerSnapshot() {
  return EMPTY;
}

export function useProgress(): ProgressState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** Records an answer. Only the first attempt counts towards accuracy; every attempt updates the streak. */
export function recordAnswer(questionId: string, concept: ConceptId, correct: boolean) {
  load();
  const prev = state.answers[questionId];
  const streak = correct ? state.streak + 1 : 0;
  emit({
    ...state,
    streak,
    bestStreak: Math.max(state.bestStreak, streak),
    answers: {
      ...state.answers,
      [questionId]: prev
        ? { ...prev, attempts: prev.attempts + 1 }
        : { concept, correct, attempts: 1, at: Date.now() },
    },
  });
}

export function setSelfRating(topic: string, rating: "review" | "ok" | null) {
  load();
  const selfRatings = { ...state.selfRatings };
  if (rating) selfRatings[topic] = rating;
  else delete selfRatings[topic];
  emit({ ...state, selfRatings });
}

/** Clears the answers whose question id starts with the prefix (e.g. one bonus lab), keeping everything else. */
export function resetAnswers(prefix: string) {
  load();
  const answers = Object.fromEntries(Object.entries(state.answers).filter(([id]) => !id.startsWith(prefix)));
  emit({ ...state, answers });
}

export function resetProgress() {
  emit(EMPTY);
}

export function conceptStats(p: ProgressState) {
  const out: Partial<Record<ConceptId, { right: number; wrong: number }>> = {};
  for (const a of Object.values(p.answers)) {
    const s = (out[a.concept] ??= { right: 0, wrong: 0 });
    if (a.correct) s.right++;
    else s.wrong++;
  }
  return out;
}
