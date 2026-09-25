"use client";

import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "@/lib/apiClient";
import { downloadText, exportBaseName } from "@/lib/download";
import { buildDiscoveryMarkdown } from "@/lib/exportMarkdown";
import type { SnapshotEntry } from "@/lib/server/snapshots";
import { statusLabel } from "@/lib/stages";

type Props = { gameId: string; refreshKey: string };

const formatDate = (iso: string) => new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

/** Saved versions (one per status change), each exportable as Markdown. */
export default function VersionHistory({ gameId, refreshKey }: Props) {
  const [entries, setEntries] = useState<SnapshotEntry[] | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const result = await apiRequest<{ snapshots: SnapshotEntry[] }>(`/api/games/${gameId}/snapshots`);
    if (!result.ok) return setError(result.error);
    setError("");
    setEntries(result.data.snapshots);
  }, [gameId]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  function exportEntry(entry: SnapshotEntry) {
    const name = `${exportBaseName(entry.state.gameInfo.gameName)}-${entry.status}-${entry.createdAt.slice(0, 10)}.md`;
    if (!downloadText(name, buildDiscoveryMarkdown(entry.state, entry.answers, new Date(entry.createdAt)), "text/markdown")) setError("Download failed.");
  }

  return (
    <section className="card">
      <h2>Version history</h2>
      <p className="hint">A version is saved each time the status changes.</p>
      {error && <p className="form-error" role="alert">{error}</p>}
      {entries && entries.length === 0 && <p className="hint">No saved versions yet.</p>}
      {entries && entries.length > 0 && (
        <table className="history-table">
          <thead>
            <tr><th>Date</th><th>Status</th><th>Who</th><th /></tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id}>
                <td className="num">{formatDate(e.createdAt)}</td>
                <td>{statusLabel(e.status)}</td>
                <td>{e.createdBy}</td>
                <td className="row-actions">
                  <button type="button" className="btn quiet" onClick={() => exportEntry(e)}>Export Markdown</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
