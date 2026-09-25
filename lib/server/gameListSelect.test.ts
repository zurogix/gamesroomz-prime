import { describe, expect, it } from "vitest";
import { GAME_LIST_SELECT } from "./gameListSelect";

describe("games list query", () => {
  it("selects only what the list shows, never the assessment state", () => {
    expect(Object.keys(GAME_LIST_SELECT).sort()).toEqual(["assessment", "id", "name", "updatedAt"]);
    expect(Object.keys(GAME_LIST_SELECT.assessment.select).sort()).toEqual(["status", "updatedAt", "updatedBy"]);
    expect(GAME_LIST_SELECT.assessment.select).not.toHaveProperty("state");
    expect(GAME_LIST_SELECT.assessment.select.updatedBy.select).toEqual({ name: true });
  });
});
