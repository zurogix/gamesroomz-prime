export const STORAGE_KEY = "gamesroomz-prime-assessment-v2";
export const LEGACY_STORAGE_KEY = "gamesroomz-prime-assessment-v1";

/** Cheap check before loading any import code: is there a draft from the local-only version? */
export function hasLocalDraft(storage: Pick<Storage, "getItem">) {
  return Boolean(storage.getItem(STORAGE_KEY) || storage.getItem(LEGACY_STORAGE_KEY));
}
