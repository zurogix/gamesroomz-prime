export type ApiResult<T> = { ok: true; status: number; data: T } | { ok: false; status: number; error: string };

const NETWORK_ERROR = "Could not reach the server. Check your connection and try again.";

/** fetch wrapper for the portal's JSON API. Never throws; failures come back as { ok: false }. */
export async function apiRequest<T>(url: string, init: RequestInit = {}): Promise<ApiResult<T>> {
  try {
    const response = await fetch(url, {
      ...init,
      headers: { "Content-Type": "application/json", ...init.headers },
      cache: "no-store",
    });
    const body = await response.json().catch(() => ({}));
    if (response.ok) return { ok: true, status: response.status, data: body as T };
    return { ok: false, status: response.status, error: (body as { error?: string }).error ?? "Request failed." };
  } catch {
    return { ok: false, status: 0, error: NETWORK_ERROR };
  }
}
