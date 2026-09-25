/** Every local autosave backup key starts with this (assessment and answers, per game). */
export const BACKUP_PREFIX = "gamesroomz-prime-backup-";

/** Drafts kept by the earlier local-only version of the portal. */
export const OLD_DRAFT_KEYS = ["gamesroomz-prime-assessment-v1", "gamesroomz-prime-assessment-v2"];

type ClearableStorage = Pick<Storage, "length" | "key" | "removeItem">;

const isPortalData = (key: string) => key.startsWith(BACKUP_PREFIX) || OLD_DRAFT_KEYS.includes(key);

/** Removes this browser's portal data on sign-out. Other keys, such as the theme preference, are kept. */
export function clearPortalData(storage: ClearableStorage) {
  const keys = Array.from({ length: storage.length }, (_, i) => storage.key(i)).filter((k): k is string => k !== null && isPortalData(k));
  keys.forEach((k) => storage.removeItem(k));
}
