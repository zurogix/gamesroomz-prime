import type { SaveState, SaveStatus } from "@/components/SaveStatusContext";

const RANK: Record<SaveState, number> = { idle: 0, saved: 1, saving: 2, error: 3, conflict: 4 };

/**
 * One indicator for two autosaves (the shared assessment and the developer's own answers):
 * the more urgent state wins, and "Retry" retries both.
 */
export function combineSaveStatus(a: SaveStatus, b: SaveStatus): SaveStatus {
  const [first, second] = RANK[a.state] >= RANK[b.state] ? [a, b] : [b, a];
  const savedAt = Math.max(a.savedAt ?? 0, b.savedAt ?? 0) || null;
  return {
    state: first.state,
    savedAt,
    message: first.message || second.message,
    retry: () => {
      a.retry();
      b.retry();
    },
  };
}
