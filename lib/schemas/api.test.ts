import { describe, expect, it } from "vitest";
import { changePasswordSchema, createMemberSchema, newPasswordSchema, resetPasswordSchema } from "./api";

const member = { email: "dev@example.com", name: "Dev", role: "developer" as const };

describe("password schemas", () => {
  it("rejects temporary passwords under 8 characters and accepts 8", () => {
    expect(createMemberSchema.safeParse({ ...member, temporaryPassword: "seven77" }).success).toBe(false);
    expect(createMemberSchema.safeParse({ ...member, temporaryPassword: "eight888" }).success).toBe(true);
    expect(resetPasswordSchema.safeParse({ temporaryPassword: "seven77" }).success).toBe(false);
    expect(resetPasswordSchema.safeParse({ temporaryPassword: "eight888" }).success).toBe(true);
    expect(resetPasswordSchema.safeParse({}).success).toBe(true);
  });

  it("rejects new passwords under 8 characters or that don't match, and accepts 8", () => {
    expect(changePasswordSchema.safeParse({ password: "seven77", confirm: "seven77" }).success).toBe(false);
    expect(changePasswordSchema.safeParse({ password: "eight888", confirm: "eight889" }).success).toBe(false);
    expect(changePasswordSchema.safeParse({ password: "eight888", confirm: "eight888" }).success).toBe(true);
    expect(newPasswordSchema.safeParse({ password: "seven77" }).success).toBe(false);
    expect(newPasswordSchema.safeParse({ password: "eight888" }).success).toBe(true);
    expect(changePasswordSchema.safeParse({ password: "seven77", confirm: "seven77" }).error?.issues[0]?.message).toBe("Use at least 8 characters.");
  });

  it("never echoes the password in error messages", () => {
    const result = createMemberSchema.safeParse({ ...member, temporaryPassword: "Secret1" });

    expect(JSON.stringify(result.error?.issues)).not.toContain("Secret1");
  });
});
