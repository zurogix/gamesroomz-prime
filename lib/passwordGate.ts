/** The page where users with a temporary password choose their own. */
export const CHANGE_PASSWORD_PATH = "/account/change-password";

export const MUST_CHANGE_PASSWORD_MESSAGE = "Please change your temporary password first.";

/** Set by the middleware on every request so server code knows which path is being served. */
export const PATHNAME_HEADER = "x-prime-pathname";

const ALLOWED_PAGES = new Set([CHANGE_PASSWORD_PATH, "/login"]);
const ALLOWED_API = new Set(["/api/me", "/api/me/password"]);

export type PasswordGate = "allow" | "redirect" | "forbid";

/**
 * What happens to a request from someone who must still change their temporary password:
 * the change page, sign-in, /api/me and /api/me/password work; other pages redirect to the
 * change page and other API routes are refused. (Signing out happens in the browser.)
 */
export function passwordChangeGate(pathname: string): PasswordGate {
  const path = pathname.replace(/\/+$/, "") || "/";
  if (path.startsWith("/api/")) return ALLOWED_API.has(path) ? "allow" : "forbid";
  return ALLOWED_PAGES.has(path) ? "allow" : "redirect";
}
