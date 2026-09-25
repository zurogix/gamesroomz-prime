"use client";

import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "@/lib/apiClient";
import { AssessmentState } from "@/lib/types";
import { CurrentUser } from "@/components/UserBadge";
import PortalWorkspace from "./PortalWorkspace";

type Loaded = { state: AssessmentState; version: number; gameName: string };
type LoadState = { kind: "loading" } | { kind: "error"; message: string } | { kind: "ready"; data: Loaded };

type Props = { gameId: string; user: CurrentUser };

/** Loads one game's assessment from the API, then hands it to the workspace. */
export default function Portal({ gameId, user }: Props) {
  const [load, setLoad] = useState<LoadState>({ kind: "loading" });

  const fetchAssessment = useCallback(async () => {
    setLoad({ kind: "loading" });
    const result = await apiRequest<{ assessment: Loaded }>(`/api/games/${gameId}/assessment`);
    if (!result.ok) return setLoad({ kind: "error", message: result.error });
    setLoad({ kind: "ready", data: result.data.assessment });
  }, [gameId]);

  useEffect(() => {
    fetchAssessment();
  }, [fetchAssessment]);

  if (load.kind === "loading") return <p className="page-message" role="status">Loading assessment…</p>;
  if (load.kind === "error") {
    return (
      <div className="page-message" role="alert">
        <p>{load.message}</p>
        <div className="pager-actions">
          <button type="button" className="btn primary" onClick={fetchAssessment}>Try again</button>
          <a className="btn" href="/">Back to games</a>
        </div>
      </div>
    );
  }
  return <PortalWorkspace gameId={gameId} initialState={load.data.state} initialVersion={load.data.version} user={user} />;
}
