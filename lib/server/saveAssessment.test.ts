import { AssessmentStatus as DbStatus } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { initialAssessment } from "@/lib/assessment";
import { PUBLISH_NEEDS_SUBMISSION } from "@/lib/responses";
import { ANSWERS_NOT_IN_ASSESSMENT, saveAssessmentSchema } from "@/lib/schemas/api";
import type { AssessmentState } from "@/lib/types";
import type { SessionProfile } from "./auth";

const findFirst = vi.fn();
const count = vi.fn();
const transaction = vi.fn();
vi.mock("./db", () => ({ db: { assessment: { findFirst }, discoveryResponse: { count }, $transaction: transaction } }));

const { saveAssessment } = await import("./saveAssessment");

const product: SessionProfile = { id: "prod-1", email: "pm@example.com", name: "PM", role: "product", mustChangePassword: false };
const developer: SessionProfile = { id: "dev-1", email: "dev@example.com", name: "Dev", role: "developer", mustChangePassword: false };

/** A stored row whose status column says one thing while its JSON still holds an older status. */
function storedRow(status: DbStatus, state: AssessmentState = initialAssessment()) {
  return { id: "a-1", version: 3, status, state: { ...state, status: "discovery" }, game: { name: "Bubble" } };
}

const withPlanEdit = (s: AssessmentState): AssessmentState => ({ ...s, plan: s.plan.map((w, i) => (i === 0 ? { ...w, whyChange: "Old Unity" } : w)) });
const withTeam = (s: AssessmentState): AssessmentState => ({ ...s, gameInfo: { ...s.gameInfo, developer: "Porting team" } });

describe("saveAssessment", () => {
  beforeEach(() => {
    [findFirst, count, transaction].forEach((fn) => fn.mockReset());
  });

  it("rejects a developer editing the plan before the plan is open", async () => {
    findFirst.mockResolvedValue(storedRow(DbStatus.findings));
    const next = { ...withPlanEdit(initialAssessment()), status: "findings" as const };

    const outcome = await saveAssessment(developer, "g-1", next, 3);

    expect(outcome).toEqual({ kind: "forbidden", message: "The conversion plan can only be changed while the plan is in progress." });
    expect(transaction).not.toHaveBeenCalled();
  });

  it("rejects a developer publishing findings", async () => {
    findFirst.mockResolvedValue(storedRow(DbStatus.discovery));

    const outcome = await saveAssessment(developer, "g-1", { ...initialAssessment(), status: "findings" }, 3);

    expect(outcome.kind).toBe("forbidden");
  });

  it("refuses to publish findings until at least one developer has submitted (400, nothing saved)", async () => {
    findFirst.mockResolvedValue(storedRow(DbStatus.discovery));
    count.mockResolvedValue(0);

    const outcome = await saveAssessment(product, "g-1", { ...initialAssessment(), status: "findings" }, 3);

    expect(outcome).toEqual({ kind: "invalid", message: PUBLISH_NEEDS_SUBMISSION });
    expect(count).toHaveBeenCalledWith({ where: { gameId: "g-1", deletedAt: null, status: "submitted" } });
    expect(transaction).not.toHaveBeenCalled();
  });

  it("publishes findings once a developer has submitted", async () => {
    findFirst.mockResolvedValue(storedRow(DbStatus.discovery));
    count.mockResolvedValue(1);
    transaction.mockResolvedValue({ kind: "saved", version: 4, updatedAt: "2026-09-26T00:00:00.000Z" });

    expect((await saveAssessment(product, "g-1", { ...initialAssessment(), status: "findings" }, 3)).kind).toBe("saved");
  });

  it("saves an allowed change without counting responses", async () => {
    findFirst.mockResolvedValue(storedRow(DbStatus.discovery));
    transaction.mockResolvedValue({ kind: "saved", version: 4, updatedAt: "2026-09-25T00:00:00.000Z" });

    const outcome = await saveAssessment(developer, "g-1", withTeam(initialAssessment()), 3);

    expect(outcome.kind).toBe("saved");
    expect(count).not.toHaveBeenCalled();
  });

  it("clears the confirmations when product requests changes, whatever the client sent", async () => {
    const ticked = { ...initialAssessment(), checks: initialAssessment().checks.map(() => true) };
    findFirst.mockResolvedValue(storedRow(DbStatus.plan_submitted, ticked));
    const update = vi.fn().mockResolvedValue({ count: 1 });
    const tx = {
      assessment: { updateMany: update, findUniqueOrThrow: vi.fn().mockResolvedValue({ version: 4, updatedAt: new Date() }) },
      assessmentSnapshot: { create: vi.fn() },
    };
    transaction.mockImplementation((run: (t: typeof tx) => unknown) => run(tx));

    await saveAssessment(product, "g-1", { ...ticked, status: "plan" }, 3);

    expect(update.mock.calls[0][0].data.state.checks.every((c: boolean) => !c)).toBe(true);
  });

  it("loads stored states that still hold Prime targets or discovery answers", async () => {
    findFirst.mockResolvedValue({ ...storedRow(DbStatus.discovery), state: { ...initialAssessment(), primeTargets: { fpsTarget: "60" }, answers: { A1: {} } } });
    transaction.mockResolvedValue({ kind: "saved", version: 4, updatedAt: "2026-09-25T00:00:00.000Z" });

    expect((await saveAssessment(developer, "g-1", withTeam(initialAssessment()), 3)).kind).toBe("saved");
  });
});

describe("assessment save body", () => {
  it("rejects any answers field", () => {
    const result = saveAssessmentSchema.safeParse({ state: { ...initialAssessment(), answers: {} }, version: 1 });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(ANSWERS_NOT_IN_ASSESSMENT);
    expect(saveAssessmentSchema.safeParse({ state: initialAssessment(), version: 1 }).success).toBe(true);
  });
});
