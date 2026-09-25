"use client";

import { useState } from "react";
import ConfirmDialog from "@/components/ConfirmDialog";
import ExportDropdown from "@/components/ExportDropdown";
import { apiRequest } from "@/lib/apiClient";
import { ALL_DEVELOPERS, discoveryFileName } from "@/lib/download";
import { buildDiscoveryMarkdown, toExportResponse } from "@/lib/exportMarkdown";
import { DISCOVERY_STATUS_LABEL, DiscoveryResponseData } from "@/lib/responses";
import { AssessmentState } from "@/lib/types";
import { NO_RESPONSES_YET } from "./DeveloperPicker";

type Props = {
  gameId: string;
  state: AssessmentState;
  responses: DiscoveryResponseData[];
  /** Opens section A showing this developer's answers (read-only). */
  onView: (responseId: string) => void;
  /** Reloads the responses after a change; resolves to an error message or null. */
  onChanged: () => Promise<string | null>;
};

const formatDate = (iso: string | null) => (iso ? new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "—");

/** Product: each developer's discovery status, with View answers, Export, Reopen (submitted only) and Remove. */
export default function ResponsesPanel({ gameId, state, responses, onView, onChanged }: Props) {
  const [removing, setRemoving] = useState<DiscoveryResponseData | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const gameName = state.gameInfo.gameName;
  const canReopen = state.status === "discovery";

  async function run(path: string, init: RequestInit) {
    setBusy(true);
    setError("");
    const result = await apiRequest(`/api/games/${gameId}/responses/${path}`, init);
    const reloadError = result.ok ? await onChanged() : null;
    setBusy(false);
    setError(result.ok ? reloadError ?? "" : result.error);
    return result.ok;
  }

  const reopen = (r: DiscoveryResponseData) => run(`${r.id}/reopen`, { method: "POST", body: "{}" });

  async function remove() {
    if (!removing) return;
    if (await run(removing.id, { method: "PATCH", body: JSON.stringify({ remove: true }) })) setRemoving(null);
  }

  return (
    <section className="card responses-panel">
      <div className="responses-head">
        <h2>Discovery responses</h2>
        {responses.length > 0 && (
          <ExportDropdown
            label="Export all"
            buildMarkdown={() => buildDiscoveryMarkdown(state, responses.map(toExportResponse))}
            fileName={() => discoveryFileName(gameName, ALL_DEVELOPERS)}
          />
        )}
      </div>
      {responses.length === 0 && <p className="hint">{NO_RESPONSES_YET}</p>}
      {responses.length > 0 && (
        <ul className="responses-list">
          {responses.map((r) => (
            <li key={r.id}>
              <div className="responses-who">
                <button type="button" className="link-btn" onClick={() => onView(r.id)}>{r.developerName}</button>
                <small className="hint">
                  {DISCOVERY_STATUS_LABEL[r.status]}{r.submittedAt ? ` · ${formatDate(r.submittedAt)}` : ""}
                </small>
              </div>
              <div className="row-actions">
                <button type="button" className="btn quiet" onClick={() => onView(r.id)}>View answers</button>
                <ExportDropdown
                  label="Export"
                  ariaLabel={`Export ${r.developerName}'s answers`}
                  buildMarkdown={() => buildDiscoveryMarkdown(state, [toExportResponse(r)])}
                  fileName={() => discoveryFileName(gameName, r.developerName)}
                />
                {r.status === "submitted" && canReopen && (
                  <button type="button" className="btn quiet" disabled={busy} onClick={() => reopen(r)}>Reopen</button>
                )}
                <button type="button" className="btn quiet" disabled={busy} onClick={() => setRemoving(r)}>Remove</button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {error && <p className="form-error" role="alert">{error}</p>}
      {removing && (
        <ConfirmDialog title="Remove answers?" confirmLabel={busy ? "Removing…" : "Remove"} confirmDisabled={busy} onConfirm={remove} onCancel={() => setRemoving(null)}>
          <p>Remove {removing.developerName}&apos;s answers? They&apos;ll start with a blank form. The answers are kept in the database.</p>
          {error && <p className="form-error" role="alert">{error}</p>}
        </ConfirmDialog>
      )}
    </section>
  );
}
