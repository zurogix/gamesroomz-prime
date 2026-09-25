import { z } from "zod";
import { PROJECT_FILE_LIMIT_BYTES } from "@/lib/discovery";
import type { AssessmentState } from "@/lib/types";

const TEXT_MAX = 20_000;
const SHORT_MAX = 500;
const text = z.string().max(TEXT_MAX);
const short = z.string().max(SHORT_MAX);
const days = z.number().finite().min(0).max(10_000);

export const classificationSchema = z.enum(["reuse", "extend", "refactor", "rewrite", "new", "remove", ""]);
export const statusSchema = z.enum(["discovery", "findings", "plan", "plan-submitted", "agreed"]);
const riskSchema = z.enum(["low", "medium", "high"]);

const choiceAnswerSchema = z.object({ selected: z.array(short).max(50), other: text });

const questionAnswerSchema = z.object({
  choice: choiceAnswerSchema,
  rows: z.record(short, choiceAnswerSchema),
  text,
  notSureYet: z.boolean(),
  needsChecking: text,
  followUps: z.record(short, choiceAnswerSchema.extend({ text })),
  evidence: text,
  basis: z.enum(["confirmed", "tested", "assumption", "investigate", ""]),
  confirmBy: text,
  files: z.record(short, z.string().max(PROJECT_FILE_LIMIT_BYTES)),
});

const gameInfoSchema = z.object({
  gameName: short,
  developer: short,
});

const engineOptionSchema = z.object({
  coreOrBuildDays: days,
  mobileRegressionDays: days,
  primeIntegrationDays: days,
  qaDays: days,
  sharedCode: z.enum(["high", "medium", "low", ""]),
  risk: riskSchema,
  maintenanceImpact: text,
  notes: text,
});

const engineAssessmentSchema = z.object({
  engineClassification: classificationSchema,
  recommendedPath: z.enum(["shared", "separate", ""]),
  pathJustification: text,
  networkingFramework: short,
  stateUpdateModel: short,
  rewriteReason: text,
  reusableComponents: text,
  migrationPlan: text,
  sharedCore: engineOptionSchema,
  separatePrime: engineOptionSchema,
});

const workstreamSchema = z.object({
  id: short,
  title: short,
  category: z.enum(["game", "platform"]),
  currentImplementation: text,
  primeRequirement: text,
  classification: classificationSchema,
  whyChange: text,
  proposedImplementation: text,
  reusedComponents: text,
  changedComponents: text,
  deliverable: text,
  personDays: days,
  dependencies: text,
  risk: riskSchema,
  scopeType: z.enum(["mandatory", "enhancement"]),
});

/**
 * The full portal state, as saved to Assessment.state and accepted by imports.
 * Unknown keys (e.g. primeTargets from older saves) are stripped, not rejected.
 */
/** One developer's discovery answers (DiscoveryResponse.answers). */
export const answersSchema = z.record(short, questionAnswerSchema);

export const assessmentStateSchema = z.object({
  gameInfo: gameInfoSchema,
  engineAssessment: engineAssessmentSchema,
  plan: z.array(workstreamSchema).max(100),
  status: statusSchema,
  checks: z.array(z.boolean()).max(50),
  lastSavedAt: z.string().optional(),
});

// Compile-time guarantee that the schema and the TypeScript type stay in step.
type Parsed = z.infer<typeof assessmentStateSchema>;
export type SchemaMatchesState = Parsed extends AssessmentState ? (AssessmentState extends Parsed ? true : never) : never;
export const schemaMatchesState: SchemaMatchesState = true;
