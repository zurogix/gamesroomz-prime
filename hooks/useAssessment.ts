"use client";
import { useCallback, useEffect, useState } from "react";
import {
  canSetStatus,
  hydrateAssessment,
  initialAssessment,
  syncPlanFromAssessment,
} from "@/lib/assessment";
import { questions } from "@/lib/questions";
import {
  AssessmentState,
  GameInfo,
  QuestionResponse,
  Workstream,
} from "@/lib/types";
const STORAGE_KEY = "gamesroomz-prime-assessment-v2";
const LEGACY_KEY = "gamesroomz-prime-assessment-v1";
const SAVE_DELAY_MS = 300;
function readDraft(): AssessmentState | null {
  try {
    const saved =
      localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_KEY);
    return saved ? hydrateAssessment(JSON.parse(saved)) : null;
  } catch {
    return null;
  }
}
function invalidate(s: AssessmentState): AssessmentState {
  return {
    ...s,
    checks: s.checks.map(() => false),
    status: s.status === "draft" ? "draft" : "planning",
  };
}
export function useAssessment() {
  const [state, setState] = useState<AssessmentState>(() =>
    initialAssessment(),
  );
  const [loaded, setLoaded] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [saveError, setSaveError] = useState(false);
  useEffect(() => {
    const draft = readDraft();
    if (draft) setState(draft);
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (!loaded) return;
    const save = () => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        setSavedAt(Date.now());
        setSaveError(false);
      } catch {
        setSaveError(true);
      }
    };
    const timer = window.setTimeout(save, SAVE_DELAY_MS);
    const onVisibility = () => {
      if (document.visibilityState === "hidden") save();
    };
    window.addEventListener("pagehide", save);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("pagehide", save);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [state, loaded]);
  const updateGameInfo = useCallback((key: keyof GameInfo, value: string) => {
    setState((s) => ({
      ...invalidate(s),
      gameInfo: { ...s.gameInfo, [key]: value },
      plan: s.plan.map((w) => ({ ...w, reviewed: false })),
    }));
  }, []);
  const updateResponse = useCallback(
    (id: string, patch: Partial<QuestionResponse>) => {
      setState((s) => ({
        ...invalidate(s),
        responses: { ...s.responses, [id]: { ...s.responses[id], ...patch } },
        plan: s.plan.map((w) =>
          w.id === questions.find((q) => q.id === id)?.workstream
            ? { ...w, reviewed: false }
            : w,
        ),
      }));
    },
    [],
  );
  const updatePlan = useCallback((id: string, patch: Partial<Workstream>) => {
    setState((s) => ({
      ...invalidate(s),
      plan: s.plan.map((w) =>
        w.id === id
          ? {
              ...w,
              ...patch,
              reviewed: patch.reviewed ?? false,
              ...(patch.classification === "na" ? { personDays: 0 } : {}),
            }
          : w,
      ),
    }));
  }, []);
  const setStatus = useCallback((status: AssessmentState["status"]) => {
    setState((s) => (canSetStatus(s, status) ? { ...s, status } : s));
  }, []);
  const toggleCheck = useCallback((index: number) => {
    setState((s) => ({
      ...s,
      status:
        s.status === "approved" || s.status === "submitted"
          ? "planning"
          : s.status,
      checks: s.checks.map((c, i) => (i === index ? !c : c)),
    }));
  }, []);
  const syncPlan = useCallback(() => {
    setState((s) => ({
      ...invalidate(s),
      plan: syncPlanFromAssessment(s),
      status: "planning",
    }));
  }, []);
  const reset = useCallback(() => {
    setState(initialAssessment());
    setSavedAt(null);
  }, []);
  return {
    state,
    loaded,
    savedAt,
    saveError,
    updateGameInfo,
    updateResponse,
    updatePlan,
    setStatus,
    toggleCheck,
    syncPlan,
    reset,
  };
}
export type AssessmentApi = ReturnType<typeof useAssessment>;
