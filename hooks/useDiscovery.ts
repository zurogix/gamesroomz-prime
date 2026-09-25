"use client";

import { useCallback, useState } from "react";
import { apiRequest } from "@/lib/apiClient";
import { answerFor, type AnswerMap } from "@/lib/discoveryAnswers";
import { QuestionAnswer } from "@/lib/discoveryTypes";
import type { Role } from "@/lib/permissions";
import type { DiscoveryResponseData } from "@/lib/responses";
import type { AssessmentStatus } from "@/lib/types";
import { BACKUP_PREFIX, useVersionedAutosave } from "./useVersionedAutosave";

/** What the page loads with the game: the developer's own response, or every response for product. */
export type DiscoveryData = { own: DiscoveryResponseData | null; responses: DiscoveryResponseData[] };

export const answersBackupKey = (gameId: string) => `${BACKUP_PREFIX}${gameId}-answers`;

/**
 * Discovery answers for the workspace. A developer edits their own response (autosaved while it is in
 * progress and the game is in discovery). Product reads every developer's response and never edits.
 */
export function useDiscovery(gameId: string, role: Role, gameStatus: AssessmentStatus, initial: DiscoveryData) {
  const [own, setOwn] = useState(initial.own);
  const [answers, setAnswers] = useState<AnswerMap>(initial.own?.answers ?? {});
  const [responses, setResponses] = useState(initial.responses);
  const [viewingId, setViewingId] = useState<string | null>(initial.responses[0]?.id ?? null);

  const canEditOwn = role === "developer" && own?.status === "in-progress" && gameStatus === "discovery";

  const send = useCallback(
    (data: AnswerMap, version: number) =>
      apiRequest<{ version: number }>(`/api/games/${gameId}/responses/me`, { method: "PUT", body: JSON.stringify({ answers: data, version }) }),
    [gameId],
  );
  const autosave = useVersionedAutosave(answersBackupKey(gameId), answers, initial.own?.version ?? 1, send, canEditOwn);

  const updateAnswer = useCallback((id: string, update: (answer: QuestionAnswer) => QuestionAnswer) => {
    setAnswers((current) => ({ ...current, [id]: update(answerFor(current, id)) }));
  }, []);

  /** Saves anything pending, then submits; resolves to an error message or null. */
  const submitOwn = useCallback(async (): Promise<string | null> => {
    if (!(await autosave.flush())) return autosave.message || "Your latest answers could not be saved. Please try again.";
    const result = await apiRequest<{ response: DiscoveryResponseData }>(`/api/games/${gameId}/responses/me/submit`, { method: "POST", body: "{}" });
    if (!result.ok) return result.error;
    setOwn(result.data.response);
    return null;
  }, [autosave, gameId]);

  /** Product: reload every response (after reopening or removing one). */
  const refreshResponses = useCallback(async (): Promise<string | null> => {
    const result = await apiRequest<{ responses: DiscoveryResponseData[] }>(`/api/games/${gameId}/responses`);
    if (!result.ok) return result.error;
    setResponses(result.data.responses);
    setViewingId((current) => (result.data.responses.some((r) => r.id === current) ? current : result.data.responses[0]?.id ?? null));
    return null;
  }, [gameId]);

  const viewing = responses.find((r) => r.id === viewingId) ?? null;

  return {
    own,
    responses,
    viewing,
    setViewingId,
    /** The answers the discovery pages show: your own (developer) or the selected developer's (product). */
    shownAnswers: role === "developer" ? answers : viewing?.answers ?? {},
    canEditOwn,
    updateAnswer,
    autosave,
    submitOwn,
    refreshResponses,
  };
}
