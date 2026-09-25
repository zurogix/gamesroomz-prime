"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ApiResult } from "@/lib/apiClient";
import { SaveState, SaveStatus } from "@/components/SaveStatusContext";

const SAVE_DELAY_MS = 1000;

/** Every local backup key starts with this, so signing out can clear them all. */
export const BACKUP_PREFIX = "gamesroomz-prime-backup-";

export type SendVersioned<T> = (data: T, version: number) => Promise<ApiResult<{ version: number }>>;

export type AutosaveStatus = SaveStatus & {
  /** Saves any pending change now; resolves true once everything is saved. */
  flush: () => Promise<boolean>;
};

function writeBackup(key: string, json: string) {
  try {
    localStorage.setItem(key, json);
  } catch {
    // Storage unavailable: the pending change is still held in memory.
  }
}

function clearBackup(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    // Nothing to clear.
  }
}

/**
 * Debounced save with optimistic locking. A 409 stops autosaving so nothing is overwritten silently;
 * a local backup exists only while a save is pending or failed. With enabled=false nothing is saved
 * (read-only views).
 */
export function useVersionedAutosave<T>(backupKey: string, data: T, initialVersion: number, send: SendVersioned<T>, enabled = true): AutosaveStatus {
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const version = useRef(initialVersion);
  const lastSaved = useRef(JSON.stringify(data));
  const latest = useRef(data);
  const inFlight = useRef<Promise<boolean> | null>(null);
  const stopped = useRef(false);

  useEffect(() => {
    latest.current = data;
  }, [data]);

  const saveOnce = useCallback(async (): Promise<boolean> => {
    const json = JSON.stringify(latest.current);
    if (json === lastSaved.current) {
      setSaveState("saved");
      clearBackup(backupKey);
      return true;
    }
    setSaveState("saving");
    const result = await send(latest.current, version.current);
    if (!result.ok) {
      if (result.status === 409) stopped.current = true;
      setSaveState(result.status === 409 ? "conflict" : "error");
      setMessage(result.error);
      return false;
    }
    version.current = result.data.version;
    lastSaved.current = json;
    setSavedAt(Date.now());
    setMessage("");
    // Changes made while this save was in flight are saved straight after.
    if (JSON.stringify(latest.current) !== json) return saveOnce();
    setSaveState("saved");
    clearBackup(backupKey);
    return true;
  }, [backupKey, send]);

  const save = useCallback(async (): Promise<boolean> => {
    if (stopped.current || !enabled) return false;
    if (inFlight.current) {
      await inFlight.current;
      return save();
    }
    inFlight.current = saveOnce().finally(() => {
      inFlight.current = null;
    });
    return inFlight.current;
  }, [enabled, saveOnce]);

  useEffect(() => {
    const json = JSON.stringify(data);
    if (!enabled || stopped.current || json === lastSaved.current) return;
    writeBackup(backupKey, json);
    setSaveState("saving");
    const timer = window.setTimeout(save, SAVE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [data, backupKey, enabled, save]);

  useEffect(() => {
    function warn(event: BeforeUnloadEvent) {
      if (!enabled || JSON.stringify(latest.current) === lastSaved.current) return;
      event.preventDefault();
    }
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [enabled]);

  return { state: saveState, savedAt, message, retry: save, flush: save };
}
