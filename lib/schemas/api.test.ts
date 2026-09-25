import { describe, expect, it } from "vitest";
import { changePasswordSchema, createMemberSchema, resetPasswordSchema } from "./api";

const member = { email: "dev@example.com", name: "Dev", role: "developer" as const };

describe("password schemas", () => {
  it("rejects temporary passwords under 12 characters", () => {
    expect(createMemberSchema.safeParse({ ...member, temporaryPassword: "short-pass1" }).success).toBe(false);
    expect(createMemberSchema.safeParse({ ...member, temporaryPassword: "long-enough-12" }).success).toBe(true);
    expect(resetPasswordSchema.safeParse({ temporaryPassword: "elevenchars" }).success).toBe(false);
    expect(resetPasswordSchema.safeParse({}).success).toBe(true);
  });

  it("rejects new passwords under 12 characters or that don't match", () => {
    expect(changePasswordSchema.safeParse({ password: "elevenchars", confirm: "elevenchars" }).success).toBe(false);
    expect(changePasswordSchema.safeParse({ password: "twelve-chars", confirm: "twelve-chars!" }).success).toBe(false);
    expect(changePasswordSchema.safeParse({ password: "twelve-chars", confirm: "twelve-chars" }).success).toBe(true);
  });

  it("never echoes the password in error messages", () => {
    const result = createMemberSchema.safeParse({ ...member, temporaryPassword: "Secret1" });

    expect(JSON.stringify(result.error?.issues)).not.toContain("Secret1");
  });
});
