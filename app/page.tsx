import NoAccess from "@/components/auth/NoAccess";
import GamesHome from "@/components/games/GamesHome";
import { getProfile } from "@/lib/server/auth";
import { loadGameList, toGameSummaries } from "@/lib/server/games";
import { requirePageIdentity, toPageAuth } from "@/lib/server/pageAuth";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const identity = await requirePageIdentity();
  // The profile check and the list queries run together; games are shown only if access is confirmed,
  // and the discovery column is reduced to what the role may see (identity id = profile id).
  const [profile, list] = await Promise.all([getProfile(identity), loadGameList(identity.id)]);
  const auth = await toPageAuth(identity, profile);
  if (auth.kind === "no-access") return <NoAccess email={auth.email} />;
  return <GamesHome user={auth.user} initialGames={toGameSummaries(list, auth.user.role)} />;
}
