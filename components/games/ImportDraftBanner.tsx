"use client";

import { FormEvent, useEffect, useState } from "react";
import { clearLocalDrafts, readImportableDraft } from "@/lib/importDraft";
import type { GameSummary } from "@/lib/server/games";
import type { AssessmentState } from "@/lib/types";
import { CurrentUser } from "@/components/UserBadge";
import { importToGame, ImportTarget } from "./importToGame";

const NEW_GAME = "__new__";

type Props = { user: CurrentUser; games: GameSummary[]; onImported: () => void };

function readLocalDraft(): AssessmentState | null {
  try {
    return readImportableDraft(localStorage);
  } catch {
    return null;
  }
}

/** Offers to move the draft saved in this browser into a game. The draft is removed only after a successful save. */
export default function ImportDraftBanner({ user, games, onImported }: Props) {
  const canCreate = user.role === "product";
  const [draft, setDraft] = useState<AssessmentState | null>(null);
  const [choice, setChoice] = useState("");
  const [newName, setNewName] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const local = readLocalDraft();
    setDraft(local);
    setNewName(local?.gameInfo.gameName ?? "");
    setChoice(games[0]?.id ?? (canCreate ? NEW_GAME : ""));
  }, [games, canCreate]);

  if (done) return <p className="import-banner" role="status">Draft imported. <a href={`/games/${done}`}>Open the game</a>.</p>;
  if (!draft) return null;

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!draft) return;
    const target: ImportTarget = choice === NEW_GAME ? { kind: "new", name: newName.trim() } : { kind: "existing", gameId: choice };
    if (target.kind === "existing" && !window.confirm("This replaces the game's current answers and plan with the draft. Continue?")) return;
    setBusy(true);
    setError("");
    const result = await importToGame(draft, target, user.role);
    setBusy(false);
    if (!result.ok) return setError(result.error);
    try {
      clearLocalDrafts(localStorage);
    } catch {
      // The draft stays in the browser; importing again is harmless.
    }
    setDone(result.gameId);
    onImported();
  }

  return (
    <form className="import-banner" onSubmit={submit}>
      <b>Import the draft saved in this browser</b>
      <div className="inline-form">
        <div className="field">
          <label htmlFor="import-target">Import into</label>
          <select id="import-target" value={choice} onChange={(e) => setChoice(e.target.value)} required>
            {games.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            {canCreate && <option value={NEW_GAME}>A new game…</option>}
          </select>
        </div>
        {choice === NEW_GAME && (
          <div className="field">
            <label htmlFor="import-name">New game name</label>
            <input id="import-name" type="text" maxLength={120} value={newName} onChange={(e) => setNewName(e.target.value)} required />
          </div>
        )}
        <button type="submit" className="btn primary" disabled={busy || !choice}>{busy ? "Importing…" : "Import draft"}</button>
      </div>
      {!canCreate && games.length === 0 && <p className="hint">Ask the product team to create the game first.</p>}
      {error && <p className="form-error" role="alert">{error} The draft is still saved in this browser.</p>}
    </form>
  );
}
