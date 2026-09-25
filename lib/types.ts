export type Classification = "reuse" | "extend" | "refactor" | "rewrite" | "new" | "remove" | "";
export type Risk = "low" | "medium" | "high";
export type ScopeType = "mandatory" | "enhancement";
export type Category = "game" | "platform";
export type RecommendedPath = "shared" | "separate" | "";
export type SharedCodeLevel = "high" | "medium" | "low" | "";
/** Game-level status. Discovery submission is per developer (see DiscoveryResponse), not a game status. */
export type AssessmentStatus = "discovery" | "findings" | "plan" | "plan-submitted" | "agreed";

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
  engineAssessment: MultiplayerEngineAssessment;
  plan: Workstream[];
  status: AssessmentStatus;
  checks: boolean[];
  lastSavedAt?: string;
};

/** A draft as read from storage: any part may be missing or out of date. */
export type SavedDraft = Omit<Partial<AssessmentState>, "gameInfo" | "engineAssessment" | "status"> & {
  gameInfo?: Partial<GameInfo>;
  engineAssessment?: Partial<MultiplayerEngineAssessment>;
  status?: string;
};
