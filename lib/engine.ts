import { EngineOptionEstimate, MultiplayerEngineAssessment } from "./types";

export const ENGINE_WORKSTREAM_ID = "multiplayer-engine-2";

export const emptyEngineOption = (): EngineOptionEstimate => ({
  coreOrBuildDays: 0,
  mobileRegressionDays: 0,
  primeIntegrationDays: 0,
  qaDays: 0,
  sharedCode: "",
  risk: "medium",
  maintenanceImpact: "",
  notes: "",
});

export const emptyEngineAssessment = (): MultiplayerEngineAssessment => ({
  engineClassification: "",
  recommendedPath: "",
  pathJustification: "",
  networkingFramework: "",
  stateUpdateModel: "",
  rewriteReason: "",
  reusableComponents: "",
  migrationPlan: "",
  sharedCore: emptyEngineOption(),
  separatePrime: emptyEngineOption(),
});

export function engineOptionTotal(option: EngineOptionEstimate) {
  return (
    (Number(option.coreOrBuildDays) || 0) +
    (Number(option.mobileRegressionDays) || 0) +
    (Number(option.primeIntegrationDays) || 0) +
    (Number(option.qaDays) || 0)
  );
}

/** The estimate that counts toward the plan comes from the recommended path only. */
export function selectedEngineEstimate(engine: MultiplayerEngineAssessment): EngineOptionEstimate | null {
  if (engine.recommendedPath === "shared") return engine.sharedCore;
  if (engine.recommendedPath === "separate") return engine.separatePrime;
  return null;
}

export function rewriteNeedsEvidence(engine: MultiplayerEngineAssessment) {
  if (engine.engineClassification !== "rewrite") return false;
  return !engine.rewriteReason.trim() || !engine.reusableComponents.trim();
}

export function engineAssessmentIssues(engine: MultiplayerEngineAssessment) {
  const issues: string[] = [];

  if (!engine.engineClassification) {
    issues.push("Select what happens to the existing multiplayer engine: Reuse, Extend, Refactor or Rewrite.");
  }
  if (!engine.networkingFramework.trim()) issues.push("Document the current networking framework.");
  if (!engine.stateUpdateModel.trim()) issues.push("Document the current state/update model.");
  if (engineOptionTotal(engine.sharedCore) <= 0) issues.push("Estimate the Shared Engine 2.0 path.");
  if (engineOptionTotal(engine.separatePrime) <= 0) issues.push("Estimate the Separate Prime Engine path.");
  if (!engine.sharedCore.maintenanceImpact.trim()) issues.push("Describe ongoing maintenance for the Shared Engine 2.0 path.");
  if (!engine.separatePrime.maintenanceImpact.trim()) issues.push("Describe ongoing maintenance for the Separate Prime Engine path.");
  if (!engine.recommendedPath) issues.push("Select a recommended path");
  if (!engine.pathJustification.trim()) issues.push("Explain why this path was recommended");

  if (engine.engineClassification === "rewrite") {
    if (!engine.rewriteReason.trim()) issues.push("A Rewrite decision requires a concrete technical reason.");
    if (!engine.reusableComponents.trim()) issues.push("A Rewrite decision must still identify reusable components.");
  }

  return issues;
}
