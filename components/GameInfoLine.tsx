"use client";

import { FormEvent, useState } from "react";
import { GameInfo } from "@/lib/types";

type Props = {
  gameInfo: GameInfo;
  onDeveloper: (developer: string) => void;
  canEdit: boolean;
};

/** "<Game name> · Developer: <team>" with an inline edit for the team. The name is changed from the games list. */
export default function GameInfoLine({ gameInfo, onDeveloper, canEdit }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(gameInfo.developer);

  function start() {
    setDraft(gameInfo.developer);
    setEditing(true);
  }

  function save(event: FormEvent) {
    event.preventDefault();
    onDeveloper(draft.trim());
    setEditing(false);
  }

  return (
    <div className="game-line">
      <b>{gameInfo.gameName || "Untitled game"}</b>
      <span aria-hidden="true">·</span>
      {editing ? (
        <form className="game-line-form" onSubmit={save}>
          <label htmlFor="gi-developer">Developer:</label>
          <input id="gi-developer" type="text" maxLength={200} value={draft} placeholder="Name or team" autoFocus onChange={(e) => setDraft(e.target.value)} />
          <button type="submit" className="btn">Save</button>
          <button type="button" className="btn quiet" onClick={() => setEditing(false)}>Cancel</button>
        </form>
      ) : (
        <>
          <span>Developer: {gameInfo.developer || <em className="hint">not recorded</em>}</span>
          {canEdit && <button type="button" className="btn quiet" onClick={start}>Edit</button>}
        </>
      )}
    </div>
  );
}
