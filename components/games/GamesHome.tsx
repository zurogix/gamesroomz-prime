"use client";

import { useCallback, useState } from "react";
import { apiRequest } from "@/lib/apiClient";
import type { GameSummary } from "@/lib/server/games";
import AppHeader from "@/components/AppHeader";
import { CurrentUser } from "@/components/UserBadge";
import GameRow from "./GameRow";
import ImportDraftBanner from "./ImportDraftBanner";
import NewGameForm from "./NewGameForm";

type Props = { user: CurrentUser; initialGames: GameSummary[] };

export default function GamesHome({ user, initialGames }: Props) {
  const [games, setGames] = useState(initialGames);
  const canManage = user.role === "product";

  const refresh = useCallback(async () => {
    const result = await apiRequest<{ games: GameSummary[] }>("/api/games");
    if (result.ok) setGames(result.data.games);
  }, []);

  return (
    <div className="page">
      <AppHeader user={user} />
      <main className="page-main">
        <h1>Games</h1>
        <ImportDraftBanner user={user} games={games} onImported={refresh} />
        {canManage && <NewGameForm />}
        {games.length === 0 ? (
          <p className="hint">{canManage ? "No games yet. Create the first one above." : "No games yet. The product team will add them."}</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Game</th><th>Status</th><th>Last updated</th><th>Updated by</th>{canManage && <th />}</tr>
              </thead>
              <tbody>
                {games.map((g) => <GameRow key={g.id} game={g} canManage={canManage} onChanged={refresh} />)}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
