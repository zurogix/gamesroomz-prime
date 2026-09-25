import type { EmailOtpType, SupabaseClient } from "@supabase/supabase-js";

/**
 * Invite and reset links arrive in one of three forms depending on the email template:
 * ?code= (PKCE), ?token_hash=&type= (custom template) or #access_token= (default invite).
 */
export async function establishSessionFromUrl(supabase: SupabaseClient): Promise<boolean> {
  try {
    const url = new URL(window.location.href);
    const hash = new URLSearchParams(url.hash.slice(1));
    const code = url.searchParams.get("code");
    const tokenHash = url.searchParams.get("token_hash");
    const type = url.searchParams.get("type") as EmailOtpType | null;
    const accessToken = hash.get("access_token");
    const refreshToken = hash.get("refresh_token");

    if (code) await supabase.auth.exchangeCodeForSession(code);
    else if (tokenHash && type) await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    else if (accessToken && refreshToken) await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });

    window.history.replaceState(null, "", url.pathname);
    const { data } = await supabase.auth.getUser();
    return Boolean(data.user);
  } catch {
    return false;
  }
}
