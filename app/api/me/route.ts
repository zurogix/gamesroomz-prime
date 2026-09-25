import { NextResponse } from "next/server";
import { requireProfile } from "@/lib/server/auth";
import { handle } from "@/lib/server/http";

export async function GET() {
  return handle("GET /api/me", async () => {
    const auth = await requireProfile();
    if (!auth.ok) return auth.response;
    return NextResponse.json({ profile: auth.value });
  });
}
