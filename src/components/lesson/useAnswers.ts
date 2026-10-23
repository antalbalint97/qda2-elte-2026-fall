"use client";

// The learner's lesson answers, kept in this browser only (see src/lib/course/storage.ts).
import { deleteAnswers, loadAnswers, saveAnswers, type LessonAnswers, type StoreStatus } from "@/lib/course/storage";
import { useCallback, useEffect, useRef, useState } from "react";

type Entry = LessonAnswers["answers"][string];
export interface AnswerApi {
  get: (key: string) => Entry | undefined;
  set: (key: string, value: Omit<Entry, "at">) => void;
  all: () => LessonAnswers;
  clear: () => void;
  count: number;
  status: StoreStatus;
  /** True once the stored answers have been read (after hydration). */
  ready: boolean;
  /** Increments each time the answers are deleted, so fields showing a stored answer can re-read it. */
  generation: number;
}

export function useAnswers(): AnswerApi {
  const store = useRef<LessonAnswers>({ v: 1, answers: {} });
  const [count, setCount] = useState(0);
  const [status, setStatus] = useState<StoreStatus>("ok");
  const [ready, setReady] = useState(false);
  const [generation, setGeneration] = useState(0);
  useEffect(() => {
    store.current = loadAnswers();
    setCount(Object.keys(store.current.answers).length);
    setReady(true);
  }, []);
  const set = useCallback((key: string, value: Omit<Entry, "at">) => {
    store.current = { v: 1, answers: { ...store.current.answers, [key]: { ...value, at: new Date().toISOString() } } };
    setStatus(saveAnswers(store.current));
    setCount(Object.keys(store.current.answers).length);
  }, []);
  const get = useCallback((key: string) => store.current.answers[key], []);
  const clear = useCallback(() => {
    deleteAnswers();
    store.current = { v: 1, answers: {} };
    setCount(0);
    setGeneration((g) => g + 1);
  }, []);
  return { get, set, all: () => store.current, clear, count, status, ready, generation };
}
