"use client";

import { FormEvent, useState } from "react";
import { apiRequest } from "@/lib/apiClient";

export default function NewGameForm() {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const result = await apiRequest<{ game: { id: string } }>("/api/games", { method: "POST", body: JSON.stringify({ name }) });
    setBusy(false);
    if (!result.ok) return setError(result.error);
    window.location.assign(`/games/${result.data.game.id}`);
  }

  return (
    <form className="inline-form" onSubmit={submit}>
      <div className="field">
        <label htmlFor="new-game-name">New game</label>
        <input id="new-game-name" type="text" value={name} maxLength={120} placeholder="Game name" onChange={(e) => setName(e.target.value)} required />
      </div>
      <button type="submit" className="btn primary" disabled={busy || !name.trim()}>{busy ? "Creating…" : "Create game"}</button>
      {error && <p className="form-error" role="alert">{error}</p>}
    </form>
  );
}
