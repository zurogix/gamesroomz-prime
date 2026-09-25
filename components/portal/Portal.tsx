"use client";

import { useCallback, useState } from "react";
import { apiRequest } from "@/lib/apiClient";
import { AssessmentState } from "@/lib/types";
import { CurrentUser } from "@/components/UserBadge";
import PortalWorkspace from "./PortalWorkspace";

export type PortalData = { state: AssessmentState; version: number };

type Props = { gameId: string; user: CurrentUser; initial: PortalData };

/**
 * Shows the workspace with the assessment the server loaded with the page. The API is called only
 * when the user reloads after "Someone else saved changes"; the workspace then restarts from the
 * latest saved version.
 */
export default function Portal({ gameId, user, initial }: Props) {
  const [data, setData] = useState(initial);
  const [generation, setGeneration] = useState(0);

  const reload = useCallback(async (): Promise<string | null> => {
    const result = await apiRequest<{ assessment: PortalData }>(`/api/games/${gameId}/assessment`);
    if (!result.ok) return result.error;
    setData({ state: result.data.assessment.state, version: result.data.assessment.version });
    setGeneration((g) => g + 1);
    return null;
  }, [gameId]);

  return (
    <PortalWorkspace
      key={generation}
      gameId={gameId}
      initialState={data.state}
      initialVersion={data.version}
      user={user}
      onReload={reload}
    />
  );
}
