export type Answer = "yes" | "no" | "unsure" | "awaiting" | "";
export type Classification = "reuse" | "modify" | "rewrite" | "new" | "na" | "";
export type Risk = "low" | "medium" | "high" | "";
export type ScopeType = "mandatory" | "enhancement";

export type Question = {
  id: string;
  section: string;
  prompt: string;
  helper?: string;
  workstream: string;
};

export type QuestionResponse = {
  answer: Answer;
  classification: Classification;
  explanation: string;
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
  personDays: number | null;
  reviewed: boolean;
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
  targetHardware: string;
  targetUnity: string;
  targetLayout: string;
  platformContract: string;
  performanceTarget: string;
};

export type AssessmentState = {
  schemaVersion: 2;
  legacyDraft?: unknown;
  gameInfo: GameInfo;
  responses: Record<string, QuestionResponse>;
  plan: Workstream[];
  status: "draft" | "assessment-complete" | "planning" | "submitted" | "changes-requested" | "approved";
  checks: boolean[];
  lastSavedAt?: string;
};

