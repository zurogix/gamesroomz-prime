import { AssessmentStatus as DbStatus } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { initialAssessment } from "@/lib/assessment";
import type { AssessmentState } from "@/lib/types";
import type { SessionProfile } from "./auth";

const findFirst = vi.fn();
const transaction = vi.fn();
vi.mock("./db", () => ({ db: { assessment: { findFirst }, $transaction: transaction } }));

const { saveAssessment } = await import("./saveAssessment");

const product: SessionProfile = { id: "prod-1", email: "pm@example.com", name: "PM", role: "product" };
const developer: SessionProfile = { id: "dev-1", email: "dev@example.com", name: "Dev", role: "developer" };

/** A stored row whose status column says one thing while its JSON still holds an older status. */
function storedRow(status: DbStatus, state: AssessmentState = initialAssessment()) {
  return { id: "a-1", version: 3, status, state: { ...state, status: "discovery" }, game: { name: "Bubble" } };
}

const withAnswer = (s: AssessmentState): AssessmentState => ({ ...s, answers: { A1: { ...answer(), text: "2021.3" } } });
const withPlanEdit = (s: AssessmentState): AssessmentState => ({ ...s, plan: s.plan.map((w, i) => (i === 0 ? { ...w, whyChange: "Old Unity" } : w)) });

function answer() {
  return { choice: { selected: [], other: "" }, rows: {}, text: "", notSureYet: false, needsChecking: "", followUps: {}, evidence: "", basis: "" as const, confirmBy: "", files: {} };
}

describe("saveAssessment", () => {
  beforeEach(() => {
    findFirst.mockReset();
    transaction.mockReset();
  });

  it("rejects a developer editing discovery after it was submitted (status column decides)", async () => {
    findFirst.mockResolvedValue(storedRow(DbStatus.discovery_submitted));
    const next = { ...withAnswer(initialAssessment()), status: "discovery-submitted" as const };

    const outcome = await saveAssessment(developer, "g-1", next, 3);

    expect(outcome).toEqual({ kind: "forbidden", message: "Discovery answers can only be changed while discovery is in progress." });
    expect(transaction).not.toHaveBeenCalled();
  });

  it("rejects a developer editing the plan before the plan is open", async () => {
    findFirst.mockResolvedValue(storedRow(DbStatus.findings));
    const next = { ...withPlanEdit(initialAssessment()), status: "findings" as const };

    const outcome = await saveAssessment(developer, "g-1", next, 3);

    expect(outcome).toEqual({ kind: "forbidden", message: "The conversion plan can only be changed while the plan is in progress." });
    expect(transaction).not.toHaveBeenCalled();
  });

  it("rejects a developer publishing findings", async () => {
    findFirst.mockResolvedValue(storedRow(DbStatus.discovery_submitted));

    const outcome = await saveAssessment(developer, "g-1", { ...initialAssessment(), status: "findings" }, 3);

    expect(outcome.kind).toBe("forbidden");
  });

  it("saves an allowed change", async () => {
    findFirst.mockResolvedValue(storedRow(DbStatus.discovery));
    transaction.mockResolvedValue({ kind: "saved", version: 4, updatedAt: "2026-09-25T00:00:00.000Z" });

    const outcome = await saveAssessment(developer, "g-1", withAnswer(initialAssessment()), 3);

    expect(outcome.kind).toBe("saved");
    expect(transaction).toHaveBeenCalledOnce();
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

  it("loads a stored state that still holds Prime targets", async () => {
    findFirst.mockResolvedValue({ ...storedRow(DbStatus.discovery), state: { ...initialAssessment(), primeTargets: { fpsTarget: "60" } } });
    transaction.mockResolvedValue({ kind: "saved", version: 4, updatedAt: "2026-09-25T00:00:00.000Z" });

    const outcome = await saveAssessment(developer, "g-1", withAnswer(initialAssessment()), 3);

    expect(outcome.kind).toBe("saved");
  });
});
