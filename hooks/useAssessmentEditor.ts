"use client";

import { useCallback, useState } from "react";
import { applyEngineEstimate } from "@/lib/assessment";
import { applyStatusChange } from "@/lib/stageActions";
import { AssessmentState, EngineOptionEstimate, GameInfo, MultiplayerEngineAssessment, Workstream } from "@/lib/types";

function withEngine(s: AssessmentState, engineAssessment: MultiplayerEngineAssessment): AssessmentState {
  return { ...s, engineAssessment, plan: applyEngineEstimate(s.plan, engineAssessment) };
}

/** In-memory editing of one assessment. Persistence is handled by useAssessmentSync. */
export function useAssessmentEditor(initial: AssessmentState) {
  const [state, setState] = useState<AssessmentState>(initial);

  const updateGameInfo = useCallback((key: keyof GameInfo, value: string) => {
    setState((s) => ({ ...s, gameInfo: { ...s.gameInfo, [key]: value } }));
  }, []);

  const updateEngineAssessment = useCallback((patch: Partial<MultiplayerEngineAssessment>) => {
    setState((s) => withEngine(s, { ...s.engineAssessment, ...patch }));
  }, []);

  const updateEngineOption = useCallback((option: "sharedCore" | "separatePrime", patch: Partial<EngineOptionEstimate>) => {
    setState((s) => withEngine(s, { ...s.engineAssessment, [option]: { ...s.engineAssessment[option], ...patch } }));
  }, []);

  const updatePlan = useCallback((id: string, patch: Partial<Workstream>) => {
    setState((s) => ({ ...s, plan: s.plan.map((w) => (w.id === id ? { ...w, ...patch } : w)) }));
  }, []);

  const setStatus = useCallback((status: AssessmentState["status"]) => {
    setState((s) => applyStatusChange(s, status));
  }, []);

  const toggleCheck = useCallback((index: number) => {
    setState((s) => ({ ...s, checks: s.checks.map((c, i) => (i === index ? !c : c)) }));
  }, []);

  return {
    state,
    updateGameInfo,
    updateEngineAssessment,
    updateEngineOption,
    updatePlan,
    setStatus,
    toggleCheck,
  };
}
