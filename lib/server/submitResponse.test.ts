import { DiscoveryStatus } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DISCOVERY_QUESTIONS } from "@/lib/discovery";
import { emptyAnswer, NOT_SURE_ID } from "@/lib/discoveryAnswers";
import { UNANSWERED_ERROR } from "@/lib/responses";

const assessmentFindFirst = vi.fn();
const responseFindFirst = vi.fn();
const responseUpdate = vi.fn();
vi.mock("@/lib/server/db", () => ({
  db: {
    assessment: { findFirst: assessmentFindFirst },
    discoveryResponse: { findFirst: responseFindFirst, update: responseUpdate },
  },
}));

const DEV_ID = "44444444-4444-4444-8444-444444444444";
vi.mock("@/lib/server/auth", () => ({
  requireProfile: async () => ({ ok: true, value: { id: DEV_ID, email: "dev@example.com", name: "Dev", role: "developer", mustChangePassword: false } }),
}));

const { POST } = await import("@/app/api/games/[id]/responses/me/submit/route");

const GAME_ID = "55555555-5555-4555-8555-555555555555";
const submit = () => POST(new Request("http://test/submit", { method: "POST" }), { params: Promise.resolve({ id: GAME_ID }) });

/** Choices say "Not sure"; open questions only tick "Not sure yet", with no note. */
function notSureWithoutNotes() {
  return Object.fromEntries(DISCOVERY_QUESTIONS.map((q) => {
    if (q.type === "open") return [q.id, { ...emptyAnswer(), notSureYet: true }];
    if (q.type === "rows") return [q.id, { ...emptyAnswer(), rows: Object.fromEntries(q.rows.map((r) => [r.id, { selected: [NOT_SURE_ID], other: "" }])) }];
    return [q.id, { ...emptyAnswer(), choice: { selected: [NOT_SURE_ID], other: "" } }];
  }));
}

const row = (answers: object, status: DiscoveryStatus = DiscoveryStatus.in_progress) => ({
  id: "r-1", gameId: GAME_ID, profileId: DEV_ID, answers, status, version: 2, submittedAt: null, profile: { name: "Dev" },
});

describe("POST /api/games/[id]/responses/me/submit", () => {
  beforeEach(() => {
    [assessmentFindFirst, responseFindFirst, responseUpdate].forEach((fn) => fn.mockReset());
    assessmentFindFirst.mockResolvedValue({ status: "discovery" });
  });

  it("accepts 'Not sure yet' without a note as an answer", async () => {
    responseFindFirst.mockResolvedValue(row(notSureWithoutNotes()));
    responseUpdate.mockImplementation(async () => ({ ...row(notSureWithoutNotes(), DiscoveryStatus.submitted), submittedAt: new Date() }));

    const response = await submit();

    expect(response.status).toBe(200);
    expect(responseUpdate).toHaveBeenCalledOnce();
    expect((await response.json()).response.status).toBe("submitted");
  });

  it("refuses while a question has no answer at all", async () => {
    const answers = notSureWithoutNotes();
    delete answers[DISCOVERY_QUESTIONS[0].id];
    responseFindFirst.mockResolvedValue(row(answers));

    const response = await submit();

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: UNANSWERED_ERROR });
    expect(responseUpdate).not.toHaveBeenCalled();
  });
});
