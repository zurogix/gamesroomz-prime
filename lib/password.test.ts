import { describe, expect, it } from "vitest";
import { GENERATED_PASSWORD_LENGTH, generatePassword, MIN_PASSWORD_LENGTH, PASSWORD_ALPHABET } from "./password";

describe("generatePassword", () => {
  it("returns 10 characters from the allowed set only", () => {
    Array.from({ length: 200 }, () => generatePassword()).forEach((password) => {
      expect(password).toHaveLength(10);
      expect([...password].every((c) => PASSWORD_ALPHABET.includes(c))).toBe(true);
    });
  });

  it("never uses look-alike characters", () => {
    expect(PASSWORD_ALPHABET).not.toMatch(/[0O1lI]/);
    expect(PASSWORD_ALPHABET).toMatch(/^[A-Za-z2-9]+$/);
  });

  it("uses the shared lengths: 10 generated, minimum 8", () => {
    expect(GENERATED_PASSWORD_LENGTH).toBe(10);
    expect(MIN_PASSWORD_LENGTH).toBe(8);
    expect(generatePassword().length).toBeGreaterThanOrEqual(MIN_PASSWORD_LENGTH);
  });

  it("differs between calls", () => {
    expect(new Set(Array.from({ length: 50 }, () => generatePassword())).size).toBe(50);
  });
});
