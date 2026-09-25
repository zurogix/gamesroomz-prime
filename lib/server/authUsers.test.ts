import { beforeEach, describe, expect, it, vi } from "vitest";

const createUser = vi.fn();
const updateUserById = vi.fn();
const listUsers = vi.fn();
vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: () => ({ auth: { admin: { createUser, updateUserById, listUsers } } }),
}));

const upsert = vi.fn();
vi.mock("./db", () => ({ db: { profile: { upsert } } }));

const { createOrLinkAuthUser, AuthUserError } = await import("./authUsers");
const { createMember } = await import("./team");

const PASSWORD = "Temporary-Pass-42";
const EXISTING_ID = "11111111-1111-4111-8111-111111111111";

describe("creating accounts", () => {
  beforeEach(() => {
    [createUser, updateUserById, listUsers, upsert].forEach((fn) => fn.mockReset());
    upsert.mockImplementation(({ create }) => Promise.resolve({ ...create }));
  });

  it("creates a confirmed user with the temporary password and no email", async () => {
    createUser.mockResolvedValue({ data: { user: { id: "new-id" } }, error: null });

    expect(await createOrLinkAuthUser("dev@example.com", "Dev", PASSWORD)).toBe("new-id");
    expect(createUser).toHaveBeenCalledWith({ email: "dev@example.com", password: PASSWORD, email_confirm: true, user_metadata: { name: "Dev" } });
    expect(updateUserById).not.toHaveBeenCalled();
  });

  it("links an existing Supabase user: reuses its id and sets the temporary password", async () => {
    createUser.mockResolvedValue({ data: { user: null }, error: { code: "email_exists", message: "already registered" } });
    listUsers.mockResolvedValue({ data: { users: [{ id: "other", email: "x@example.com" }, { id: EXISTING_ID, email: "Dev@Example.com" }] }, error: null });
    updateUserById.mockResolvedValue({ data: {}, error: null });

    const member = await createMember("dev@example.com", "Dev", "developer", PASSWORD);

    expect(member.id).toBe(EXISTING_ID);
    expect(updateUserById).toHaveBeenCalledWith(EXISTING_ID, { password: PASSWORD });
    expect(upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: EXISTING_ID },
      update: expect.objectContaining({ deletedAt: null, mustChangePassword: true, role: "developer" }),
    }));
  });

  it("reports a rejected password without including it", async () => {
    createUser.mockResolvedValue({ data: { user: null }, error: { code: "weak_password", message: "weak" } });

    const error = await createOrLinkAuthUser("dev@example.com", "Dev", PASSWORD).catch((e) => e);

    expect(error).toBeInstanceOf(AuthUserError);
    expect(String(error.message)).not.toContain(PASSWORD);
  });
});
