"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiRequest } from "@/lib/apiClient";
import { AssessmentState } from "@/lib/types";
import { SaveState, SaveStatus } from "@/components/SaveStatusContext";

const SAVE_DELAY_MS = 1000;

export const backupKey = (gameId: string) => `gamesroomz-prime-backup-${gameId}`;

function writeBackup(gameId: string, json: string) {
  try {
    localStorage.setItem(backupKey(gameId), json);
  } catch {
    // Storage unavailable: the pending change is still held in memory.
  }
}

function clearBackup(gameId: string) {
  try {
    localStorage.removeItem(backupKey(gameId));
  } catch {
    // Nothing to clear.
  }
}

/**
 * Debounced save of the whole state with optimistic locking. A 409 stops autosaving so
 * nothing is overwritten silently; a local backup exists only while a save is pending or failed.
 */
export function useAssessmentSync(gameId: string, state: AssessmentState, initialVersion: number): SaveStatus {
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const version = useRef(initialVersion);
  const lastSaved = useRef(JSON.stringify(state));
  const latest = useRef(state);
  const inFlight = useRef(false);
  const queued = useRef(false);
  const stopped = useRef(false);

  useEffect(() => {
    latest.current = state;
  }, [state]);

  const save = useCallback(async () => {
    if (stopped.current) return;
    if (inFlight.current) {
      queued.current = true;
      return;
    }
    const json = JSON.stringify(latest.current);
    if (json === lastSaved.current) {
      setSaveState("saved");
      clearBackup(gameId);
      return;
    }
    inFlight.current = true;
    setSaveState("saving");
    const result = await apiRequest<{ version: number }>(`/api/games/${gameId}/assessment`, {
      method: "PUT",
      body: JSON.stringify({ state: latest.current, version: version.current }),
    });
    inFlight.current = false;

    if (result.ok) {
      version.current = result.data.version;
      lastSaved.current = json;
      setSavedAt(Date.now());
      setMessage("");
      if (queued.current || JSON.stringify(latest.current) !== json) {
        queued.current = false;
        return save();
      }
      setSaveState("saved");
      clearBackup(gameId);
      return;
    }
    if (result.status === 409) stopped.current = true;
    setSaveState(result.status === 409 ? "conflict" : "error");
    setMessage(result.error);
  }, [gameId]);

  useEffect(() => {
    const json = JSON.stringify(state);
    if (stopped.current || json === lastSaved.current) return;
    writeBackup(gameId, json);
    setSaveState("saving");
    const timer = window.setTimeout(save, SAVE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [state, gameId, save]);

  useEffect(() => {
    function warn(event: BeforeUnloadEvent) {
      if (JSON.stringify(latest.current) === lastSaved.current) return;
      event.preventDefault();
    }
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);

  return { state: saveState, savedAt, message, retry: save };
}
