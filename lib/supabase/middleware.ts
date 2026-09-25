import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { publicEnv } from "@/lib/env";
import { PATHNAME_HEADER } from "@/lib/passwordGate";

const PUBLIC_PATHS = ["/login"];

export function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.includes(pathname);
}

/**
 * Refreshes the Supabase session cookie and sends signed-out visitors to /login. It also passes the
 * path on to server code (overwriting anything the client sent) for the temporary-password gate.
 */
export async function updateSession(request: NextRequest) {
  const headers = new Headers(request.headers);
  headers.set(PATHNAME_HEADER, request.nextUrl.pathname);
  const response = NextResponse.next({ request: { headers } });
  const supabase = createServerClient(publicEnv.supabaseUrl(), publicEnv.supabaseAnonKey(), {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (toSet) => {
        toSet.forEach(({ name, value }) => request.cookies.set(name, value));
        toSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;
  // API routes answer 401 themselves; pages redirect.
  if (data.user || isPublicPath(pathname) || pathname.startsWith("/api/")) return response;

  const login = request.nextUrl.clone();
  login.pathname = "/login";
  login.search = "";
  return NextResponse.redirect(login);
}
