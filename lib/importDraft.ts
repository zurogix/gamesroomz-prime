import { LEGACY_STORAGE_KEY, readDraft, STORAGE_KEY } from "./draftStorage";
import { allowedStatuses, canEditPrimeTargets, Role } from "./permissions";
import { assessmentStateSchema } from "./schemas/assessment";
import type { AssessmentState } from "./types";

type DraftStorage = Pick<Storage, "getItem">;

/** The draft saved in this browser (v2, or v1 via the existing migration), if it is valid. */
export function readImportableDraft(storage: DraftStorage): AssessmentState | null {
  const draft = readDraft(storage);
  if (!draft) return null;
  const parsed = assessmentStateSchema.safeParse(draft.state);
  return parsed.success ? parsed.data : null;
}

/**
 * The state to save when importing into a game. Parts the role may not change keep the
 * game's current values, so a developer's import is never rejected for product-only fields.
 */
export function prepareImport(draft: AssessmentState, current: AssessmentState, role: Role): AssessmentState {
  const status = allowedStatuses(role).includes(draft.status) || draft.status === current.status ? draft.status : current.status;
  return {
    ...draft,
    gameInfo: { ...draft.gameInfo, gameName: current.gameInfo.gameName },
    primeTargets: canEditPrimeTargets(role) ? draft.primeTargets : current.primeTargets,
    status,
  };
}

/** Called only after the import saved successfully. */
export function clearLocalDrafts(storage: Pick<Storage, "removeItem">) {
  storage.removeItem(STORAGE_KEY);
  storage.removeItem(LEGACY_STORAGE_KEY);
}
