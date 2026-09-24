export type Answer = "yes" | "no" | "unsure" | "";
export type Classification = "reuse" | "extend" | "refactor" | "rewrite" | "new" | "remove" | "";
export type Risk = "low" | "medium" | "high";
export type ScopeType = "mandatory" | "enhancement";
export type Category = "game" | "platform";
export type RecommendedPath = "shared" | "separate" | "";
export type SharedCodeLevel = "high" | "medium" | "low" | "";

export type Question = {
  id: string;
  section: string;
  prompt: string;
  helper?: string;
  weight: number;
  workstream: string;
  category: Category;
};

export type QuestionResponse = {
  answer: Answer;
  classification: Classification;
  explanation: string;
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

/** A draft as read from storage: any part may be missing or out of date. */
export type SavedDraft = Omit<Partial<AssessmentState>, "engineAssessment"> & {
  engineAssessment?: Partial<MultiplayerEngineAssessment>;
};
