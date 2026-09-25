import NoAccess from "@/components/auth/NoAccess";
import GamesHome from "@/components/games/GamesHome";
import { listGames } from "@/lib/server/games";
import { getPageAuth } from "@/lib/server/pageAuth";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const auth = await getPageAuth();
  if (auth.kind === "no-access") return <NoAccess email={auth.email} />;
  const games = await listGames();
  return <GamesHome user={auth.user} initialGames={games} />;
}
