import { hydrateAssessment } from "./assessment";
import { LegacyDraft, migrateV1Draft } from "./migrate";
import { AssessmentState } from "./types";

import { LEGACY_STORAGE_KEY, STORAGE_KEY } from "./localDraftKeys";

export { LEGACY_STORAGE_KEY, STORAGE_KEY };

export type LoadedDraft = { state: AssessmentState; migrated: boolean };

type ReadableStorage = Pick<Storage, "getItem">;

/** A v2 draft saved before the discovery form still carries the old Yes/No responses. */
function hasYesNoAnswers(draft: { responses?: unknown; answers?: unknown }) {
  return Boolean(draft.responses) && !draft.answers;
}

/** Reads the v2 draft, falling back to migrating a v1 draft. Returns null when there is none. */
export function readDraft(storage: ReadableStorage): LoadedDraft | null {
  try {
    const current = storage.getItem(STORAGE_KEY);
    if (current) {
      const parsed = JSON.parse(current);
      return { state: hydrateAssessment(parsed), migrated: hasYesNoAnswers(parsed) };
    }
    const legacy = storage.getItem(LEGACY_STORAGE_KEY);
    if (!legacy) return null;
    const migrated = migrateV1Draft(JSON.parse(legacy) as LegacyDraft);
    return { state: hydrateAssessment(migrated), migrated: true };
  } catch {
    return null;
  }
}
