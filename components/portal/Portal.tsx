"use client";

import { useCallback, useState } from "react";
import type { DiscoveryData } from "@/hooks/useDiscovery";
import { apiRequest } from "@/lib/apiClient";
import type { DiscoveryResponseData } from "@/lib/responses";
import { AssessmentState } from "@/lib/types";
import { CurrentUser } from "@/components/UserBadge";
import PortalWorkspace from "./PortalWorkspace";

export type PortalData = { state: AssessmentState; version: number; discovery: DiscoveryData };

type Props = { gameId: string; user: CurrentUser; initial: PortalData };

async function loadDiscovery(gameId: string, user: CurrentUser): Promise<DiscoveryData | string> {
  if (user.role === "product") {
    const result = await apiRequest<{ responses: DiscoveryResponseData[] }>(`/api/games/${gameId}/responses`);
    return result.ok ? { own: null, responses: result.data.responses } : result.error;
  }
  const result = await apiRequest<{ response: DiscoveryResponseData }>(`/api/games/${gameId}/responses/me`);
  return result.ok ? { own: result.data.response, responses: [result.data.response] } : result.error;
}

/**
 * Shows the workspace with the data the server loaded with the page. The API is called only when the
 * user reloads after "Someone else saved changes"; the workspace then restarts from the latest version.
 */
export default function Portal({ gameId, user, initial }: Props) {
  const [data, setData] = useState(initial);
  const [generation, setGeneration] = useState(0);

  const reload = useCallback(async (): Promise<string | null> => {
    const [assessment, discovery] = await Promise.all([
      apiRequest<{ assessment: { state: AssessmentState; version: number } }>(`/api/games/${gameId}/assessment`),
      loadDiscovery(gameId, user),
    ]);
    if (!assessment.ok) return assessment.error;
    if (typeof discovery === "string") return discovery;
    setData({ state: assessment.data.assessment.state, version: assessment.data.assessment.version, discovery });
    setGeneration((g) => g + 1);
    return null;
  }, [gameId, user]);

  return (
    <PortalWorkspace
      key={generation}
      gameId={gameId}
      initialState={data.state}
      initialVersion={data.version}
      initialDiscovery={data.discovery}
      user={user}
      onReload={reload}
    />
  );
}
