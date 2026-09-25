import NoAccess from "@/components/auth/NoAccess";
import GamesHome from "@/components/games/GamesHome";
import { getProfile } from "@/lib/server/auth";
import { listGames } from "@/lib/server/games";
import { requirePageIdentity, toPageAuth } from "@/lib/server/pageAuth";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const identity = await requirePageIdentity();
  // The profile check and the list query run together; games are shown only if access is confirmed.
  const [profile, games] = await Promise.all([getProfile(identity), listGames()]);
  const auth = await toPageAuth(identity, profile);
  if (auth.kind === "no-access") return <NoAccess email={auth.email} />;
  return <GamesHome user={auth.user} initialGames={games} />;
}
