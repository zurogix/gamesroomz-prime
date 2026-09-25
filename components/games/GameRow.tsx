"use client";

import { useState } from "react";
import { apiRequest } from "@/lib/apiClient";
import { currentStage, statusLabel } from "@/lib/stages";
import type { GameSummary } from "@/lib/server/games";

type Props = { game: GameSummary; canManage: boolean; onChanged: () => void };

const formatDate = (iso: string) => new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

export default function GameRow({ game, canManage, onChanged }: Props) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(game.name);
  const [error, setError] = useState("");

  async function patch(body: object) {
    const result = await apiRequest(`/api/games/${game.id}`, { method: "PATCH", body: JSON.stringify(body) });
    if (!result.ok) return setError(result.error);
    setEditing(false);
    onChanged();
  }

  function remove() {
    if (!window.confirm(`Remove "${game.name}" from the portal? It can be restored from the database if needed.`)) return;
    patch({ deleted: true });
  }

  return (
    <tr>
      <td className="ws">
        {editing ? (
          <input type="text" aria-label="Game name" value={name} maxLength={120} onChange={(e) => setName(e.target.value)} />
        ) : (
          <a href={`/games/${game.id}`}><b>{game.name}</b></a>
        )}
        {error && <small className="form-error" role="alert">{error}</small>}
      </td>
      <td>
        <b className="stage-cell">Stage {currentStage(game.status).number} · {currentStage(game.status).title}</b>
        <small className="hint">{statusLabel(game.status)}</small>
      </td>
      <td className="num">{formatDate(game.updatedAt)}</td>
      <td>{game.updatedBy || "—"}</td>
      {canManage && (
        <td className="row-actions">
          {editing ? (
            <>
              <button type="button" className="btn" onClick={() => patch({ name })} disabled={!name.trim()}>Save</button>
              <button type="button" className="btn quiet" onClick={() => setEditing(false)}>Cancel</button>
            </>
          ) : (
            <>
              <button type="button" className="btn quiet" onClick={() => setEditing(true)}>Rename</button>
              <button type="button" className="btn quiet" onClick={remove}>Remove</button>
            </>
          )}
        </td>
      )}
    </tr>
  );
}
