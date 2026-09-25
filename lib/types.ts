import type { QuestionAnswer } from "./discoveryTypes";

export type Classification = "reuse" | "extend" | "refactor" | "rewrite" | "new" | "remove" | "";
export type Risk = "low" | "medium" | "high";
export type ScopeType = "mandatory" | "enhancement";
export type Category = "game" | "platform";
export type RecommendedPath = "shared" | "separate" | "";
export type SharedCodeLevel = "high" | "medium" | "low" | "";
export type CodebaseDecision = "shared" | "separate" | "undecided" | "";
export type AssessmentStatus = "draft" | "assessment-complete" | "planning" | "submitted" | "changes-requested" | "agreed";

/** "agree-with-developer" is offered only for the Unity version and Android API level. */
export type TargetState = "set" | "not-decided" | "agree-with-developer" | "";

/** One text target: the value counts only when the state is "set". The link is used by the P1/P2 layout sketch. */
export type TargetValue = { state: TargetState; value: string; link?: string };

/** Targets confirmed by the product team; shown to developers above the discovery form. */
export type PrimeTargets = {
  codebase: CodebaseDecision;
  modes: string[];
  modesOther: string;
  firstRelease: TargetValue;
  unityVersion: TargetValue;
  androidApi: TargetValue;
  resolution: TargetValue;
  layout: TargetValue;
  fpsTarget: TargetValue;
  sdk: TargetValue;
};

export type EngineOptionEstimate = {
  coreOrBuildDays: number;
  mobileRegressionDays: number;
  primeIntegrationDays: number;
  qaDays: number;
  sharedCode: SharedCodeLevel;
  risk: Risk;
  maintenanceImpact: string;
  notes: string;
};

export type MultiplayerEngineAssessment = {
  engineClassification: Classification;
  recommendedPath: RecommendedPath;
  pathJustification: string;
  networkingFramework: string;
  stateUpdateModel: string;
  rewriteReason: string;
  reusableComponents: string;
  migrationPlan: string;
  sharedCore: EngineOptionEstimate;
  separatePrime: EngineOptionEstimate;
};

export type Workstream = {
  id: string;
  title: string;
  category: Category;
  currentImplementation: string;
  primeRequirement: string;
  classification: Classification;
  whyChange: string;
  proposedImplementation: string;
  reusedComponents: string;
  changedComponents: string;
  deliverable: string;
  personDays: number;
  dependencies: string;
  risk: Risk;
  scopeType: ScopeType;
};

/** The game name is owned by the games list; the developer / team is edited on the Overview. */
export type GameInfo = {
  gameName: string;
  developer: string;
};

export type AssessmentState = {
  gameInfo: GameInfo;
  primeTargets: PrimeTargets;
  answers: Record<string, QuestionAnswer>;
  engineAssessment: MultiplayerEngineAssessment;
  plan: Workstream[];
  status: AssessmentStatus;
  checks: boolean[];
  lastSavedAt?: string;
};

/** A draft as read from storage: any part may be missing or out of date. */
export type SavedDraft = Omit<Partial<AssessmentState>, "gameInfo" | "engineAssessment" | "primeTargets" | "answers" | "status"> & {
  gameInfo?: Partial<GameInfo>;
  engineAssessment?: Partial<MultiplayerEngineAssessment>;
  /** Older drafts hold plain strings for the text targets and a separate layoutSketch. */
  primeTargets?: Record<string, unknown>;
  answers?: Record<string, Partial<QuestionAnswer>>;
  status?: string;
};
