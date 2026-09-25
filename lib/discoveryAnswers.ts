import { DISCOVERY_QUESTIONS } from "./discovery";
import {
  Basis,
  ChoiceAnswer,
  ChoiceMode,
  ChoiceOption,
  DiscoveryQuestion,
  FollowUp,
  FollowUpAnswer,
  QuestionAnswer,
} from "./discoveryTypes";

export const OTHER_ID = "other";
export const NOT_SURE_ID = "not-sure";

const OTHER_OPTION: ChoiceOption = { id: OTHER_ID, label: "Other" };
const NOT_SURE_OPTION: ChoiceOption = { id: NOT_SURE_ID, label: "Not sure", exclusive: true };

export const BASIS_OPTIONS: { value: Basis; label: string }[] = [
  { value: "confirmed", label: "Confirmed in code" },
  { value: "tested", label: "Tested" },
  { value: "assumption", label: "Assumption" },
  { value: "investigate", label: "Needs investigation" },
];

export const TAG_ORDER = ["Engine", "Boards", "Input", "Screen", "Platform", "Risk"] as const;

export type AnswerMap = Record<string, QuestionAnswer | undefined>;

export const emptyChoice = (): ChoiceAnswer => ({ selected: [], other: "" });
export const emptyFollowUp = (): FollowUpAnswer => ({ ...emptyChoice(), text: "" });

export const emptyAnswer = (): QuestionAnswer => ({
  choice: emptyChoice(),
  rows: {},
  text: "",
  notSureYet: false,
  needsChecking: "",
  followUps: {},
  evidence: "",
  basis: "",
  confirmBy: "",
  files: {},
});

/** Every single/multi/rows choice also offers "Other" and "Not sure". */
export function withAutoOptions(options: ChoiceOption[]): ChoiceOption[] {
  return [...options, OTHER_OPTION, NOT_SURE_OPTION];
}

/**
 * Toggles one option. "Not sure" and "None of these" are exclusive: choosing one
 * clears the rest, and choosing a substantive option clears them.
 */
export function toggleOption(selected: string[], optionId: string, options: ChoiceOption[], mode: ChoiceMode): string[] {
  if (selected.includes(optionId)) return selected.filter((id) => id !== optionId);
  if (mode === "single") return [optionId];
  const exclusiveIds = options.filter((o) => o.exclusive).map((o) => o.id);
  if (exclusiveIds.includes(optionId)) return [optionId];
  return [...selected.filter((id) => !exclusiveIds.includes(id)), optionId];
}

export function answerFor(answers: AnswerMap, id: string): QuestionAnswer {
  return answers[id] ?? emptyAnswer();
}

const hasChoice = (c: ChoiceAnswer | undefined) => Boolean(c && c.selected.length > 0);

export function isAnswered(q: DiscoveryQuestion, a: QuestionAnswer): boolean {
  // "Not sure yet" is an answer on its own; what needs checking is optional.
  if (q.type === "open") return Boolean(a.text.trim()) || a.notSureYet;
  if (q.type === "rows") return q.rows.every((row) => hasChoice(a.rows[row.id]));
  return hasChoice(a.choice);
}

export function isNotSure(q: DiscoveryQuestion, a: QuestionAnswer): boolean {
  if (q.type === "open") return a.notSureYet;
  if (q.type === "rows") return Object.values(a.rows).some((r) => r.selected.includes(NOT_SURE_ID));
  return a.choice.selected.includes(NOT_SURE_ID);
}

export function followUpVisible(followUp: FollowUp, a: QuestionAnswer): boolean {
  if (!followUp.showWhen) return true;
  return a.choice.selected.some((id) => followUp.showWhen!.includes(id));
}

export function needsConfirmation(a: QuestionAnswer) {
  return a.basis === "assumption" || a.basis === "investigate";
}

export function sectionProgress(answers: AnswerMap, sectionId: string) {
  const qs = DISCOVERY_QUESTIONS.filter((q) => q.section === sectionId);
  const done = qs.filter((q) => isAnswered(q, answerFor(answers, q.id))).length;
  return { done, total: qs.length };
}

/** Saved answers for known questions only, each filled in to the current shape. */
export function hydrateAnswers(saved: unknown): Record<string, QuestionAnswer> {
  if (!saved || typeof saved !== "object") return {};
  const map = saved as Record<string, Partial<QuestionAnswer> | undefined>;
  const known = DISCOVERY_QUESTIONS.filter((q) => map[q.id]);
  return Object.fromEntries(known.map((q) => [q.id, hydrateAnswer(map[q.id])]));
}

/** Questions without an answer under isAnswered() — "Not sure" counts as an answer. */
export function unansweredQuestions(answers: AnswerMap): DiscoveryQuestion[] {
  return DISCOVERY_QUESTIONS.filter((q) => !isAnswered(q, answerFor(answers, q.id)));
}

/** Discovery can be submitted only when every question has an answer (evidence, follow-ups and basis stay optional). */
export function canSubmitDiscovery(answers: AnswerMap) {
  return unansweredQuestions(answers).length === 0;
}

export function discoveryCoverage(answers: AnswerMap) {
  const done = DISCOVERY_QUESTIONS.filter((q) => isAnswered(q, answerFor(answers, q.id))).length;
  return Math.round((done / DISCOVERY_QUESTIONS.length) * 100);
}

export type AttentionItem = { question: DiscoveryQuestion; reason: string };

/** Answers worth a follow-up conversation: Not sure, assumptions and open investigations. */
export function discoveryAttention(answers: AnswerMap): AttentionItem[] {
  return DISCOVERY_QUESTIONS.flatMap((question): AttentionItem[] => {
    const a = answerFor(answers, question.id);
    if (isNotSure(question, a)) return [{ question, reason: "Not sure" }];
    const basis = BASIS_OPTIONS.find((b) => b.value === a.basis);
    if (isAnswered(question, a) && basis && needsConfirmation(a)) return [{ question, reason: basis.label }];
    return [];
  });
}

function cleanChoice(saved: Partial<ChoiceAnswer> | undefined): ChoiceAnswer {
  return { selected: Array.isArray(saved?.selected) ? saved.selected.map(String) : [], other: saved?.other ?? "" };
}

/** Rebuilds a saved answer with every field present. */
export function hydrateAnswer(saved: Partial<QuestionAnswer> | undefined): QuestionAnswer {
  const base = emptyAnswer();
  if (!saved) return base;
  const rows = Object.fromEntries(Object.entries(saved.rows ?? {}).map(([id, r]) => [id, cleanChoice(r)]));
  const followUps = Object.fromEntries(
    Object.entries(saved.followUps ?? {}).map(([id, f]) => [id, { ...cleanChoice(f), text: f?.text ?? "" }])
  );
  return { ...base, ...saved, choice: cleanChoice(saved.choice), rows, followUps, files: { ...saved.files } };
}
