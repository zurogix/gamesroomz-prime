import { notFound } from "next/navigation";
import NoAccess from "@/components/auth/NoAccess";
import Portal from "@/components/portal/Portal";
import { idParamsSchema } from "@/lib/schemas/api";
import { getProfile } from "@/lib/server/auth";
import { loadAssessment } from "@/lib/server/games";
import { requirePageIdentity, toPageAuth } from "@/lib/server/pageAuth";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function GamePage({ params }: Props) {
  const parsed = idParamsSchema.safeParse(await params);
  if (!parsed.success) notFound();
  const identity = await requirePageIdentity();
  // Login check and assessment load in one server request, in parallel; data is used only after access is confirmed.
  const [profile, assessment] = await Promise.all([getProfile(identity), loadAssessment(parsed.data.id)]);
  const auth = await toPageAuth(identity, profile);
  if (auth.kind === "no-access") return <NoAccess email={auth.email} />;
  if (!assessment) notFound();
  return <Portal gameId={parsed.data.id} user={auth.user} initial={{ state: assessment.state, version: assessment.version }} />;
}
