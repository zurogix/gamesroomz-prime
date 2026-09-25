import { NextResponse } from "next/server";
import { safeNextPath } from "@/lib/safeRedirect";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Exchanges the one-time code from an auth email for a session cookie. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeNextPath(url.searchParams.get("next"));
  try {
    if (!code) throw new Error("Missing code");
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw error;
    return NextResponse.redirect(new URL(next, url.origin));
  } catch (err) {
    console.error("[auth] callback failed", err);
    return NextResponse.redirect(new URL("/login?error=link", url.origin));
  }
}
