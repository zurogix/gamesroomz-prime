import { ENGINE_WORKSTREAM_ID } from "./engine";
import { planTemplate } from "./questions";
import { CLASSES, ImpactClass } from "./sections";
import {
  AssessmentState,
  Classification,
  MultiplayerEngineAssessment,
  QuestionResponse,
  SavedDraft,
  Workstream,
} from "./types";

const LEGACY_ARCHITECTURE_ID = "multiplayer-architecture";

type TextField =
  | "currentImplementation"
  | "primeRequirement"
  | "whyChange"
  | "proposedImplementation"
  | "reusedComponents"
  | "changedComponents"
  | "deliverable"
  | "dependencies";

const TEXT_FIELDS: TextField[] = [
  "currentImplementation",
  "primeRequirement",
  "whyChange",
  "proposedImplementation",
  "reusedComponents",
  "changedComponents",
  "deliverable",
  "dependencies",
];

/** Template text of the retired workstream; only developer-written text is carried over. */
const LEGACY_ARCHITECTURE_DEFAULTS: Record<TextField, string> = {
  currentImplementation: "Online mobile PvP: typically one local player per device and one remote opponent.",
  primeRequirement: "Two players play simultaneously inside one Unity instance on one Prime tabletop device.",
  whyChange: "",
  proposedImplementation: "",
  reusedComponents: "Existing battle rules and game-state logic where separable from networking.",
  changedComponents: "Local/remote assumptions, player ownership, game-state orchestration and match lifecycle.",
  deliverable: "P1 and P2 can participate in the same local match instance.",
  dependencies: "Player controller, multi-touch and networking decisions.",
};

const LEGACY_STRATEGY: Record<string, Classification> = {
  reuse: "reuse",
  extend: "extend",
  refactor: "refactor",
  replace: "rewrite",
};

type LegacyResponse = Omit<Partial<QuestionResponse>, "classification"> & { classification?: string; effortDays?: number };
type LegacyWorkstream = Omit<Partial<Workstream>, "classification"> & { id?: string; classification?: string };
type LegacyEngine = Partial<MultiplayerEngineAssessment> & { strategy?: string; replaceReason?: string };

export type LegacyDraft = Omit<Partial<AssessmentState>, "responses" | "plan" | "engineAssessment"> & {
  responses?: Record<string, LegacyResponse>;
  plan?: LegacyWorkstream[];
  engineAssessment?: LegacyEngine;
};

/** "modify" no longer exists, so those items must be re-classified. */
export function migrateClassification(value: string | undefined): Classification {
  return CLASSES.includes(value as ImpactClass) ? (value as Classification) : "";
}

function migrateResponses(responses: LegacyDraft["responses"] = {}): Record<string, QuestionResponse> {
  return Object.fromEntries(
    Object.entries(responses).map(([id, r]) => [
      id,
      { answer: r.answer ?? "", classification: migrateClassification(r.classification), explanation: r.explanation ?? "" },
    ])
  );
}

function appendLegacyText(target: Workstream, legacy: LegacyWorkstream | undefined): Workstream {
  if (!legacy) return target;
  return TEXT_FIELDS.reduce<Workstream>((w, field) => {
    const text = (legacy[field] ?? "").trim();
    if (!text || text === LEGACY_ARCHITECTURE_DEFAULTS[field]) return w;
    const current = w[field].trim();
    return { ...w, [field]: current ? `${current}\n\n${text}` : text };
  }, target);
}

function migratePlan(plan: LegacyWorkstream[] = []): Workstream[] {
  const legacyArchitecture = plan.find((w) => w.id === LEGACY_ARCHITECTURE_ID);
  const kept = plan
    .filter((w) => w.id && w.id !== LEGACY_ARCHITECTURE_ID)
    .map((w) => ({ ...w, classification: migrateClassification(w.classification) }) as Workstream);
  const engineTemplate = planTemplate.find((w) => w.id === ENGINE_WORKSTREAM_ID)!;
  const savedEngine = kept.find((w) => w.id === ENGINE_WORKSTREAM_ID);
  const engine = appendLegacyText({ ...engineTemplate, ...savedEngine }, legacyArchitecture);
  return savedEngine
    ? kept.map((w) => (w.id === ENGINE_WORKSTREAM_ID ? engine : w))
    : [...kept, engine];
}

function migrateEngine(engine: LegacyEngine = {}): Partial<MultiplayerEngineAssessment> {
  const { strategy, replaceReason, ...rest } = engine;
  return {
    ...rest,
    engineClassification: LEGACY_STRATEGY[strategy ?? ""] ?? "",
    recommendedPath: "",
    pathJustification: "",
    rewriteReason: replaceReason ?? "",
  };
}

/** Converts a draft saved under the v1 storage key into the v2 shape (before hydration). */
export function migrateV1Draft(draft: LegacyDraft): SavedDraft {
  return {
    ...draft,
    responses: migrateResponses(draft.responses),
    plan: migratePlan(draft.plan),
    engineAssessment: migrateEngine(draft.engineAssessment),
  };
}
