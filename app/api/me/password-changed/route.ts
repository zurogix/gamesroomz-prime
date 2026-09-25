import { NextResponse } from "next/server";
import { requireProfile } from "@/lib/server/auth";
import { handle } from "@/lib/server/http";
import { markPasswordChanged } from "@/lib/server/team";

/** Called after the user has set their own password in the browser; clears the temporary-password flag. */
export async function POST() {
  return handle("POST /api/me/password-changed", async () => {
    const auth = await requireProfile();
    if (!auth.ok) return auth.response;
    await markPasswordChanged(auth.value.id);
    return NextResponse.json({ ok: true });
  });
}
