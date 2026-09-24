export type Answer = "yes" | "no" | "unsure" | "";
export type Classification = "reuse" | "modify" | "rewrite" | "new" | "";
export type Risk = "low" | "medium" | "high";
export type ScopeType = "mandatory" | "enhancement";
export type EngineStrategy = "reuse" | "extend" | "refactor" | "replace" | "";
export type SharedCodeLevel = "high" | "medium" | "low" | "";

export type Question = {
  id: string;
  section: string;
  prompt: string;
  helper?: string;
  weight: number;
  workstream: string;
};

export type QuestionResponse = {
  answer: Answer;
  classification: Classification;
  explanation: string;
  effortDays: number;
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
  strategy: EngineStrategy;
  networkingFramework: string;
  stateUpdateModel: string;
  replaceReason: string;
  reusableComponents: string;
  migrationPlan: string;
  sharedCore: EngineOptionEstimate;
  separatePrime: EngineOptionEstimate;
};

export type Workstream = {
  id: string;
  title: string;
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

export type GameInfo = {
  gameName: string;
  developer: string;
  currentUnity: string;
  currentAndroidApi: string;
  currentPlatforms: string;
  currentMultiplayer: string;
  targetPlayers: string;
  assessmentDate: string;
};

export type AssessmentState = {
  gameInfo: GameInfo;
  responses: Record<string, QuestionResponse>;
  engineAssessment: MultiplayerEngineAssessment;
  plan: Workstream[];
  status: "draft" | "assessment-complete" | "planning" | "submitted" | "changes-requested" | "approved";
  checks: boolean[];
  lastSavedAt?: string;
};
