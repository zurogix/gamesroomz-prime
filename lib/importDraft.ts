import { LEGACY_STORAGE_KEY, readDraft, STORAGE_KEY } from "./draftStorage";
import { applyEngineEstimate } from "./engine";
import { canEdit, Role } from "./permissions";
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
 * The state to save when importing into a game. The game keeps its status (it changes only through
 * the stage actions), and parts the role may not change in that status keep the game's current values,
 * so an import is never rejected for locked areas.
 */
export function prepareImport(draft: AssessmentState, current: AssessmentState, role: Role): AssessmentState {
  const pick = <T,>(area: Parameters<typeof canEdit>[2], fromDraft: T, fromCurrent: T) => (canEdit(role, current.status, area) ? fromDraft : fromCurrent);
  const engineAssessment = pick("engine", draft.engineAssessment, current.engineAssessment);
  return {
    ...current,
    gameInfo: { gameName: current.gameInfo.gameName, developer: pick("developerTeam", draft.gameInfo.developer, current.gameInfo.developer) },
    answers: pick("answers", draft.answers, current.answers),
    engineAssessment,
    plan: applyEngineEstimate(pick("plan", draft.plan, current.plan), engineAssessment),
    checks: pick("checks", draft.checks, current.checks),
  };
}

/** Called only after the import saved successfully. */
export function clearLocalDrafts(storage: Pick<Storage, "removeItem">) {
  storage.removeItem(STORAGE_KEY);
  storage.removeItem(LEGACY_STORAGE_KEY);
}
