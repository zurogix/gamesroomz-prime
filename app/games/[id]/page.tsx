import { notFound } from "next/navigation";
import NoAccess from "@/components/auth/NoAccess";
import Portal from "@/components/portal/Portal";
import type { DiscoveryData } from "@/hooks/useDiscovery";
import { idParamsSchema } from "@/lib/schemas/api";
import { getProfile, SessionProfile } from "@/lib/server/auth";
import { loadAssessment } from "@/lib/server/games";
import { requirePageIdentity, toPageAuth } from "@/lib/server/pageAuth";
import { getOrCreateOwnResponse, listResponses } from "@/lib/server/responses";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

/** A developer gets their own response (created on first visit); product gets everyone's. */
async function loadDiscovery(gameId: string, profile: SessionProfile): Promise<DiscoveryData> {
  if (profile.role === "product") return { own: null, responses: await listResponses(gameId) };
  const own = await getOrCreateOwnResponse(gameId, profile.id);
  return { own, responses: [own] };
}

export default async function GamePage({ params }: Props) {
  const parsed = idParamsSchema.safeParse(await params);
  if (!parsed.success) notFound();
  const identity = await requirePageIdentity();
  // Login check and assessment load in one server request, in parallel; data is used only after access is confirmed.
  const [profile, assessment] = await Promise.all([getProfile(identity), loadAssessment(parsed.data.id)]);
  const auth = await toPageAuth(identity, profile);
  if (auth.kind === "no-access" || !profile) return <NoAccess email={identity.email} />;
  if (!assessment) notFound();
  const discovery = await loadDiscovery(parsed.data.id, profile);
  return <Portal gameId={parsed.data.id} user={auth.user} initial={{ state: assessment.state, version: assessment.version, discovery }} />;
}
