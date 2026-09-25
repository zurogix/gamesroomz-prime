export const CONFLICT_MESSAGE = "This assessment was updated by someone else.";

/** A save conflicts when it was based on a different version than the one stored. */
export function isVersionConflict(storedVersion: number, sentVersion: number) {
  return storedVersion !== sentVersion;
}
