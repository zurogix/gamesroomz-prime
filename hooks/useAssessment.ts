"use client";

import { useCallback, useEffect, useState } from "react";
import { applyEngineEstimate, initialAssessment, syncPlanFromAssessment } from "@/lib/assessment";
import { LEGACY_STORAGE_KEY, readDraft, STORAGE_KEY } from "@/lib/draftStorage";
import { AssessmentState, EngineOptionEstimate, GameInfo, MultiplayerEngineAssessment, QuestionResponse, Workstream } from "@/lib/types";

const SAVE_DELAY_MS = 300;

function withEngine(s: AssessmentState, engineAssessment: MultiplayerEngineAssessment): AssessmentState {
  return { ...s, engineAssessment, plan: applyEngineEstimate(s.plan, engineAssessment) };
}

export function useAssessment() {
  const [state, setState] = useState<AssessmentState>(() => initialAssessment());
  const [loaded, setLoaded] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [migrationNotice, setMigrationNotice] = useState(false);

  useEffect(() => {
    const draft = readDraft(localStorage);
    if (draft) {
      setState(draft.state);
      setMigrationNotice(draft.migrated);
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const timer = window.setTimeout(() => {
      const lastSavedAt = new Date().toISOString();
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, lastSavedAt }));
        setSavedAt(Date.now());
      } catch {
        // Storage can be unavailable (private mode, quota); the draft stays in memory.
      }
    }, SAVE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [state, loaded]);

  const updateGameInfo = useCallback((key: keyof GameInfo, value: string) => {
    setState((s) => ({ ...s, gameInfo: { ...s.gameInfo, [key]: value } }));
  }, []);

  const updateResponse = useCallback((id: string, patch: Partial<QuestionResponse>) => {
    setState((s) => ({
      ...s,
      responses: { ...s.responses, [id]: { ...s.responses[id], ...patch } },
    }));
  }, []);

  const updateEngineAssessment = useCallback((patch: Partial<MultiplayerEngineAssessment>) => {
    setState((s) => withEngine(s, { ...s.engineAssessment, ...patch }));
  }, []);

  const updateEngineOption = useCallback((option: "sharedCore" | "separatePrime", patch: Partial<EngineOptionEstimate>) => {
    setState((s) => withEngine(s, {
      ...s.engineAssessment,
      [option]: { ...s.engineAssessment[option], ...patch },
    }));
  }, []);

  const updatePlan = useCallback((id: string, patch: Partial<Workstream>) => {
    setState((s) => ({
      ...s,
      plan: s.plan.map((w) => (w.id === id ? { ...w, ...patch } : w)),
    }));
  }, []);

  const setStatus = useCallback((status: AssessmentState["status"]) => {
    setState((s) => ({ ...s, status }));
  }, []);

  const toggleCheck = useCallback((index: number) => {
    setState((s) => ({ ...s, checks: s.checks.map((c, i) => (i === index ? !c : c)) }));
  }, []);

  const syncPlan = useCallback(() => {
    setState((s) => ({
      ...s,
      plan: syncPlanFromAssessment(s),
      status: s.status === "draft" ? "planning" : s.status,
    }));
  }, []);

  const dismissMigrationNotice = useCallback(() => setMigrationNotice(false), []);

  const reset = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    } catch {
      // Nothing to clear when storage is unavailable.
    }
    setMigrationNotice(false);
    setState(initialAssessment());
  }, []);

  return {
    state,
    loaded,
    savedAt,
    migrationNotice,
    dismissMigrationNotice,
    updateGameInfo,
    updateResponse,
    updateEngineAssessment,
    updateEngineOption,
    updatePlan,
    setStatus,
    toggleCheck,
    syncPlan,
    reset,
  };
}

export type AssessmentApi = ReturnType<typeof useAssessment>;
