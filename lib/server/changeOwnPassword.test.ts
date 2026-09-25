import { beforeEach, describe, expect, it, vi } from "vitest";

const updateUserById = vi.fn();
vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: () => ({ auth: { admin: { updateUserById } } }),
}));

const profileUpdate = vi.fn();
vi.mock("@/lib/server/db", () => ({ db: { profile: { update: profileUpdate } } }));

const USER_ID = "22222222-2222-4222-8222-222222222222";
vi.mock("@/lib/server/auth", () => ({
  requireProfile: async () => ({ ok: true, value: { id: USER_ID, email: "dev@example.com", name: "Dev", role: "developer", mustChangePassword: true } }),
}));

const { POST } = await import("@/app/api/me/password/route");

const PASSWORD = "My-Own-Password-2026";
const post = (body: unknown) => POST(new Request("http://test/api/me/password", { method: "POST", body: JSON.stringify(body) }));

describe("POST /api/me/password", () => {
  beforeEach(() => {
    updateUserById.mockReset();
    profileUpdate.mockReset().mockResolvedValue({});
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  it("sets the password for the signed-in user, then clears the flag", async () => {
    updateUserById.mockResolvedValue({ data: {}, error: null });

    const response = await post({ password: PASSWORD });

    expect(response.status).toBe(200);
    expect(updateUserById).toHaveBeenCalledWith(USER_ID, { password: PASSWORD });
    expect(profileUpdate).toHaveBeenCalledWith({ where: { id: USER_ID }, data: { mustChangePassword: false } });
    expect(updateUserById.mock.invocationCallOrder[0]).toBeLessThan(profileUpdate.mock.invocationCallOrder[0]);
    expect(await response.text()).not.toContain(PASSWORD);
  });

  it("keeps the flag when Supabase rejects the password as weak, with a readable message", async () => {
    updateUserById.mockResolvedValue({ data: null, error: { code: "weak_password", message: "weak" } });

    const response = await post({ password: PASSWORD });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toMatch(/too weak/);
    expect(JSON.stringify(body)).not.toContain(PASSWORD);
    expect(profileUpdate).not.toHaveBeenCalled();
  });

  it("keeps the flag when the update fails for another reason, without exposing details", async () => {
    updateUserById.mockResolvedValue({ data: null, error: { code: "unexpected_failure", message: "boom" } });

    const response = await post({ password: PASSWORD });

    expect(response.status).toBe(500);
    expect(await response.text()).not.toContain(PASSWORD);
    expect(profileUpdate).not.toHaveBeenCalled();
    expect(JSON.stringify((console.error as unknown as { mock: { calls: unknown[] } }).mock.calls)).not.toContain(PASSWORD);
  });

  it("rejects passwords under 8 characters before calling Supabase", async () => {
    const response = await post({ password: "seven77" });

    expect(response.status).toBe(400);
    expect(updateUserById).not.toHaveBeenCalled();
    expect(profileUpdate).not.toHaveBeenCalled();
  });
});
