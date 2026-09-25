import { describe, expect, it } from "vitest";
import { CHANGE_PASSWORD_PATH, passwordChangeGate } from "./passwordGate";

describe("temporary-password gate", () => {
  it.each([CHANGE_PASSWORD_PATH, `${CHANGE_PASSWORD_PATH}/`, "/login", "/api/me", "/api/me/password-changed"])("allows %s", (path) => {
    expect(passwordChangeGate(path)).toBe("allow");
  });

  it.each(["/", "/games/123", "/settings/team", "/account"])("redirects the page %s", (path) => {
    expect(passwordChangeGate(path)).toBe("redirect");
  });

  it.each(["/api/games", "/api/games/1/assessment", "/api/team", "/api/me/other", "/api/team/1/reset-password"])("refuses the API route %s", (path) => {
    expect(passwordChangeGate(path)).toBe("forbid");
  });
});
