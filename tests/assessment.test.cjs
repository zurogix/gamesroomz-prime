const fs = require("node:fs");
const assert = require("node:assert/strict");
const { test } = require("node:test");
const ts = require("typescript");
// Compile the app's actual pure TypeScript modules in this isolated test process.
require.extensions[".ts"] = (module, filename) =>
  module._compile(
    ts.transpileModule(fs.readFileSync(filename, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
      },
    }).outputText,
    filename,
  );
const a = require("../lib/assessment.ts");
const { questions, planTemplate } = require("../lib/questions.ts");

function complete() {
  const s = a.initialAssessment();
  for (const key of [
    "developer",
    "targetHardware",
    "targetUnity",
    "targetLayout",
    "platformContract",
    "performanceTarget",
  ])
    s.gameInfo[key] = "Confirmed test requirement";
  for (const q of questions)
    s.responses[q.id] = {
      answer: "yes",
      classification: "reuse",
      explanation: "Verified source component and two-player device test.",
    };
  s.plan = s.plan.map((w) => ({
    ...w,
    classification: "reuse",
    whyChange: "Verified compatibility",
    proposedImplementation: "Smoke test with both players",
    deliverable: "Device test passes",
    dependencies: "No external dependencies",
    personDays: 0,
    risk: "low",
    reviewed: true,
  }));
  s.checks = s.checks.map(() => true);
  return s;
}
test("all 24 focused questions map to a workstream, without preset conclusions", () => {
  assert.equal(questions.length, 24);
  assert.equal(new Set(questions.map((q) => q.id)).size, questions.length);
  for (const q of questions)
    assert.ok(planTemplate.some((w) => w.id === q.workstream));
  for (const w of planTemplate) {
    assert.ok(questions.some((q) => q.workstream === w.id));
    assert.equal(w.classification, "");
    assert.equal(w.risk, "");
    assert.equal(w.personDays, null);
  }
});
test("blank assessment has no verdict, no estimate and cannot be submitted", () => {
  const s = a.initialAssessment();
  assert.equal(a.assessmentSummary(s).label, "Not assessed");
  assert.equal(a.assessmentCoverage(s), 0);
  assert.equal(a.planCoverage(s), 0);
  assert.equal(s.plan.filter(a.hasEstimate).length, 0);
  assert.equal(a.canSetStatus(s, "submitted"), false);
});
test("classification without evidence and unresolved specifications never count as complete", () => {
  const s = complete();
  const q = questions[0];
  s.responses[q.id].explanation = " ";
  assert.equal(a.isQuestionDone(s, q), false);
  assert.equal(a.assessmentSummary(s).label, "Preliminary — incomplete");
  assert.equal(a.canSetStatus(s, "approved"), false);
  s.responses[q.id] = {
    answer: "awaiting",
    classification: "",
    explanation: "Waiting for approved SDK contract",
  };
  assert.equal(a.isQuestionDone(s, q), false);
  assert.equal(a.attentionItems(s)[0].kind, "awaiting");
});
test("verified zero-day reuse can complete, while zero-day changes cannot", () => {
  const s = complete();
  assert.equal(a.reviewBlockers(s).length, 0);
  assert.equal(a.canSetStatus(s, "submitted"), true);
  for (const classification of ["modify", "rewrite", "new"])
    assert.equal(a.hasEstimate({ ...s.plan[0], classification }), false);
  assert.equal(a.hasEstimate({ ...s.plan[0], personDays: null }), false);
  assert.equal(a.hasEstimate({ ...s.plan[0], personDays: -1 }), false);
  assert.equal(a.hasEstimate({ ...s.plan[0], personDays: Infinity }), false);
});
test("not-applicable requires a reason, zero effort, review and consistent linked findings", () => {
  const s = complete();
  const w = s.plan[0];
  Object.assign(w, {
    classification: "na",
    personDays: 0,
    whyChange: "Baseline supplied and verified outside this project",
    reviewed: true,
  });
  assert.ok(a.workstreamIssues(s, w).some((x) => x.includes("conflicts")));
  for (const q of questions.filter((q) => q.workstream === w.id))
    s.responses[q.id].classification = "na";
  assert.equal(a.workstreamIssues(s, w).length, 0);
  w.whyChange = "";
  assert.ok(a.workstreamIssues(s, w).length);
});
test("workstream Reuse cannot hide a linked requirement for changes", () => {
  const s = complete();
  s.responses[questions[0].id].classification = "modify";
  assert.ok(
    a.workstreamIssues(s, s.plan[0]).some((x) => x.includes("conflicts")),
  );
  assert.equal(a.canSetStatus(s, "submitted"), false);
});
test("totals count workstreams once, exclude N/A, and ignore invalid estimates", () => {
  const s = a.initialAssessment();
  Object.assign(s.plan[0], { classification: "modify", personDays: 2.5 });
  Object.assign(s.plan[1], {
    classification: "new",
    personDays: 3,
    scopeType: "enhancement",
  });
  Object.assign(s.plan[2], { classification: "na", personDays: 9 });
  Object.assign(s.plan[3], { classification: "modify", personDays: -4 });
  s.responses[questions[0].id].effortDays = 100; // Legacy per-question estimates must never be summed.
  assert.equal(a.totalPlanDays(s), 5.5);
  assert.equal(
    s.plan
      .filter((w) => w.scopeType === "mandatory")
      .reduce((n, w) => n + a.effortDays(w), 0),
    2.5,
  );
});
test("copy findings preserves authored plans and estimates, without selecting a strongest classification", () => {
  const s = a.initialAssessment();
  const q = questions[0];
  s.responses[q.id] = {
    answer: "yes",
    classification: "rewrite",
    explanation: "Specific adapter needs replacement",
  };
  s.plan[0].personDays = 4;
  const copied = a.syncPlanFromAssessment(s);
  assert.match(copied[0].whyChange, /Specific adapter/);
  assert.equal(copied[0].classification, "");
  assert.equal(copied[0].personDays, 4);
  s.plan[0].whyChange = "Authored plan rationale";
  s.plan[0].classification = "modify";
  assert.equal(
    a.syncPlanFromAssessment(s)[0].whyChange,
    "Authored plan rationale",
  );
  assert.equal(a.syncPlanFromAssessment(s)[0].classification, "modify");
});
test("legacy migration preserves a complete reference, notes and positive estimates, but requires reassessment", () => {
  const old = {
    gameInfo: { gameName: "Existing game" },
    responses: {
      "gameplay-core": {
        answer: "yes",
        classification: "reuse",
        effortDays: 2,
      },
    },
    plan: [
      {
        ...planTemplate[0],
        classification: "rewrite",
        risk: "high",
        personDays: 5,
        whyChange: "Developer notes",
      },
    ],
    status: "approved",
    checks: [true, true, true, true],
  };
  const s = a.hydrateAssessment(old);
  assert.deepEqual(s.legacyDraft, old);
  assert.equal(s.gameInfo.gameName, "Existing game");
  assert.equal(s.plan[0].whyChange, "Developer notes");
  assert.equal(s.plan[0].personDays, 5);
  assert.equal(s.plan[0].classification, "");
  assert.equal(s.plan[0].risk, "");
  assert.equal(s.plan[0].reviewed, false);
  assert.equal(a.assessmentCoverage(s), 0);
  assert.equal(s.status, "draft");
  assert.ok(s.checks.every((x) => !x));
});
test("current draft roundtrip retains valid approval; malformed data cannot grant it", () => {
  const s = complete();
  s.status = "approved";
  assert.equal(
    a.hydrateAssessment(JSON.parse(JSON.stringify(s))).status,
    "approved",
  );
  s.plan[0].personDays = -5;
  const repaired = a.hydrateAssessment(s);
  assert.equal(repaired.plan[0].personDays, null);
  assert.equal(repaired.status, "draft");
  assert.equal(a.hydrateAssessment(null).schemaVersion, 2);
});
test("target gaps, missing review or confirmations block approval", () => {
  const s = complete();
  s.gameInfo.targetLayout = "";
  assert.equal(a.canSetStatus(s, "assessment-complete"), false);
  assert.equal(a.canSetStatus(s, "approved"), false);
  s.gameInfo.targetLayout = "Opposite seating";
  s.plan[0].reviewed = false;
  assert.equal(a.canSetStatus(s, "approved"), false);
  s.plan[0].reviewed = true;
  s.checks[0] = false;
  assert.equal(a.canSetStatus(s, "submitted"), false);
});
