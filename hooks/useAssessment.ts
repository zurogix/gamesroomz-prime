"use client";

import { useCallback, useEffect, useState } from "react";
import { hydrateAssessment, initialAssessment, syncPlanFromAssessment } from "@/lib/assessment";
import { AssessmentState, GameInfo, QuestionResponse, Workstream } from "@/lib/types";

const STORAGE_KEY = "gamesroomz-prime-assessment-v1";
const SAVE_DELAY_MS = 300;

function readDraft(): AssessmentState | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? hydrateAssessment(JSON.parse(saved)) : null;
  } catch {
    return null;
  }
}

export function useAssessment() {
  const [state, setState] = useState<AssessmentState>(() => initialAssessment());
  const [loaded, setLoaded] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    const draft = readDraft();
    if (draft) setState(draft);
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

  const reset = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Nothing to clear when storage is unavailable.
    }
    setState(initialAssessment());
  }, []);

  return { state, loaded, savedAt, updateGameInfo, updateResponse, updatePlan, setStatus, toggleCheck, syncPlan, reset };
}

export type AssessmentApi = ReturnType<typeof useAssessment>;
