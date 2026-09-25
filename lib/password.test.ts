import { describe, expect, it } from "vitest";
import { generatePassword, PASSWORD_ALPHABET } from "./password";

describe("generatePassword", () => {
  it("returns 16 characters from the allowed set only", () => {
    Array.from({ length: 200 }, () => generatePassword()).forEach((password) => {
      expect(password).toHaveLength(16);
      expect([...password].every((c) => PASSWORD_ALPHABET.includes(c))).toBe(true);
    });
  });

  it("never uses look-alike characters", () => {
    expect(PASSWORD_ALPHABET).not.toMatch(/[0O1lI]/);
    expect(PASSWORD_ALPHABET).toMatch(/^[A-Za-z2-9]+$/);
  });

  it("differs between calls", () => {
    expect(new Set(Array.from({ length: 50 }, () => generatePassword())).size).toBe(50);
  });
});
