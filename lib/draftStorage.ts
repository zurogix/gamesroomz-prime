import { hydrateAssessment } from "./assessment";
import { LegacyDraft, migrateV1Draft } from "./migrate";
import { AssessmentState } from "./types";

export const STORAGE_KEY = "gamesroomz-prime-assessment-v2";
export const LEGACY_STORAGE_KEY = "gamesroomz-prime-assessment-v1";

export type LoadedDraft = { state: AssessmentState; migrated: boolean };

type ReadableStorage = Pick<Storage, "getItem">;

/** Reads the v2 draft, falling back to migrating a v1 draft. Returns null when there is none. */
export function readDraft(storage: ReadableStorage): LoadedDraft | null {
  try {
    const current = storage.getItem(STORAGE_KEY);
    if (current) return { state: hydrateAssessment(JSON.parse(current)), migrated: false };
    const legacy = storage.getItem(LEGACY_STORAGE_KEY);
    if (!legacy) return null;
    const migrated = migrateV1Draft(JSON.parse(legacy) as LegacyDraft);
    return { state: hydrateAssessment(migrated), migrated: true };
  } catch {
    return null;
  }
}
