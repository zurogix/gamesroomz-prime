"use client";

import { useState } from "react";
import ConfirmDialog from "@/components/ConfirmDialog";
import { apiRequest } from "@/lib/apiClient";
import { DISCOVERY_STATUS_LABEL, DiscoveryResponseData } from "@/lib/responses";
import { AssessmentStatus } from "@/lib/types";
import { NO_RESPONSES_YET } from "./DeveloperPicker";

type Props = {
  gameId: string;
  gameStatus: AssessmentStatus;
  responses: DiscoveryResponseData[];
  /** Reloads the responses after a change; resolves to an error message or null. */
  onChanged: () => Promise<string | null>;
};

const formatDate = (iso: string | null) => (iso ? new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "—");

/** Product: each developer's discovery status, with Reopen (submitted only) and Remove. */
export default function ResponsesPanel({ gameId, gameStatus, responses, onChanged }: Props) {
  const [removing, setRemoving] = useState<DiscoveryResponseData | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

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
    <section className="card">
      <h2>Discovery responses</h2>
      {responses.length === 0 && <p className="hint">{NO_RESPONSES_YET}</p>}
      {responses.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Developer</th><th>Status</th><th>Submitted</th><th /></tr></thead>
            <tbody>
              {responses.map((r) => (
                <tr key={r.id}>
                  <td><b>{r.developerName}</b></td>
                  <td>{DISCOVERY_STATUS_LABEL[r.status]}</td>
                  <td className="num">{formatDate(r.submittedAt)}</td>
                  <td className="row-actions">
                    {r.status === "submitted" && gameStatus === "discovery" && (
                      <button type="button" className="btn quiet" disabled={busy} onClick={() => reopen(r)}>Reopen</button>
                    )}
                    <button type="button" className="btn quiet" disabled={busy} onClick={() => setRemoving(r)}>Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
