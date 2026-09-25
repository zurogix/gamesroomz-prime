import { notFound } from "next/navigation";
import NoAccess from "@/components/auth/NoAccess";
import Portal from "@/components/portal/Portal";
import { idParamsSchema } from "@/lib/schemas/api";
import { getPageAuth } from "@/lib/server/pageAuth";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function GamePage({ params }: Props) {
  const parsed = idParamsSchema.safeParse(await params);
  if (!parsed.success) notFound();
  const auth = await getPageAuth();
  if (auth.kind === "no-access") return <NoAccess email={auth.email} />;
  return <Portal gameId={parsed.data.id} user={auth.user} />;
}
