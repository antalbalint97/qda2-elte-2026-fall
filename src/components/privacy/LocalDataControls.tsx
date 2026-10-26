"use client";

import { Button } from "@/components/ui/Button";
import { resetProgress, useProgress } from "@/lib/progress";
import { STORAGE_KEYS } from "@/lib/theme";
import { useState, useSyncExternalStore } from "react";

const LABELS: Record<keyof typeof STORAGE_KEYS, string> = {
  progress: "Quiz answers, streaks and self-ratings",
  theme: "Light / dark theme choice",
  presentation: "Presentation mode setting",
  sopranosNotes: "Notes typed in the Sopranos bonus lab",
  lessonAnswers: "Predictions, reflections and quiz answers typed in course lessons",
  courseDrafts: "Course drafts made in the Course Builder (authoring deployments only)",
  atlasPending: "A block picked in the Concept Atlas to add in the Course Builder",
};

// Snapshots are re-read on every render, which each action below triggers.
const noopSubscribe = () => () => {};

/** Which keys exist right now, as a stable string so React can compare snapshots. */
function storedSnapshot(): string {
  try {
    return (Object.keys(STORAGE_KEYS) as Array<keyof typeof STORAGE_KEYS>)
      .map((k) => {
        const v = window.localStorage.getItem(STORAGE_KEYS[k]);
        return v === null ? "" : `${k}:${v.length}`;
      })
      .join("|");
  } catch {
    return "unavailable";
  }
}

export function LocalDataControls() {
  const progress = useProgress();
  const snapshot = useSyncExternalStore(noopSubscribe, storedSnapshot, () => "server");
  const [confirming, setConfirming] = useState<null | "progress" | "all">(null);
  const [status, setStatus] = useState("");
  const answered = Object.keys(progress.answers).length;

  const sizes = new Map(
    snapshot
      .split("|")
      .filter((s) => s.includes(":"))
      .map((s) => s.split(":") as [string, string]),
  );

  function clearProgress() {
    resetProgress();
    setConfirming(null);
    setStatus("Learning progress was reset in this browser.");
  }

  function clearAll() {
    try {
      Object.values(STORAGE_KEYS).forEach((k) => window.localStorage.removeItem(k));
    } catch {
      setStatus("This browser blocked access to local storage, so nothing could be deleted here.");
      setConfirming(null);
      return;
    }
    // Reloading drops the in-memory copies (quiz state, notes) as well.
    window.location.reload();
  }

  return (
    <div className="rounded-2xl border border-line bg-surface p-4 sm:p-6">
      <h3 className="tracking-tight text-xl font-semibold text-ink">What this browser holds for this site</h3>
      {snapshot === "unavailable" ? (
        <p className="mt-3 text-sm text-muted">
          Local storage is blocked or unavailable in this browser. The site still works, but progress is kept only
          until the page is closed.
        </p>
      ) : (
        <table className="mt-4 w-full border-collapse text-left text-sm">
          <caption className="sr-only">Locally stored items and whether they are present</caption>
          <thead>
            <tr className="border-b border-line text-xs text-muted">
              <th scope="col" className="py-2 pr-3 font-medium">
                Item
              </th>
              <th scope="col" className="py-2 pr-3 font-medium">
                Storage key
              </th>
              <th scope="col" className="py-2 font-medium">
                Present
              </th>
            </tr>
          </thead>
          <tbody>
            {(Object.keys(STORAGE_KEYS) as Array<keyof typeof STORAGE_KEYS>).map((k) => (
              <tr key={k} className="border-b border-line last:border-0">
                <td className="py-2 pr-3 text-ink">{LABELS[k]}</td>
                <td className="py-2 pr-3 font-mono text-xs text-muted">{STORAGE_KEYS[k]}</td>
                <td className="py-2 text-ink">
                  {snapshot === "server" ? "…" : sizes.has(k) ? `yes (${sizes.get(k)} characters)` : "no"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p className="mt-3 text-sm text-muted">
        Quiz questions answered so far in this browser: <strong className="text-ink">{answered}</strong>.
      </p>

      <div className="mt-5 flex flex-wrap gap-3">
        {confirming === null && (
          <>
            <Button onClick={() => setConfirming("progress")}>Reset learning progress</Button>
            <Button onClick={() => setConfirming("all")}>Delete everything this site stored here</Button>
          </>
        )}
        {confirming !== null && (
          <div className="w-full rounded-xl border border-neg/30 bg-neg-soft p-4" role="group" aria-label="Confirm deletion">
            <p className="text-sm text-ink">
              {confirming === "progress"
                ? "Clear all quiz answers, streaks and self-ratings in this browser? This cannot be undone."
                : "Delete progress, notes, lesson answers, course drafts and display settings stored by this site in this browser? The page will reload. This cannot be undone."}
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              <Button variant="primary" onClick={confirming === "progress" ? clearProgress : clearAll}>
                {confirming === "progress" ? "Yes, reset progress" : "Yes, delete everything"}
              </Button>
              <Button onClick={() => setConfirming(null)}>Cancel</Button>
            </div>
          </div>
        )}
      </div>
      <p role="status" aria-live="polite" className="mt-3 min-h-5 text-sm text-pos">
        {status}
      </p>
    </div>
  );
}
