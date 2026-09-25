import { DISCOVERY_QUESTIONS, DISCOVERY_SECTIONS, PROJECT_FILES } from "./discovery";
import {
  answerFor,
  BASIS_OPTIONS,
  followUpVisible,
  isAnswered,
  isNotSure,
  needsConfirmation,
  NOT_SURE_ID,
  OTHER_ID,
} from "./discoveryAnswers";
import { ChoiceAnswer, ChoiceOption, DiscoveryQuestion, FollowUp, FollowUpAnswer, QuestionAnswer } from "./discoveryTypes";
import {
  CODEBASE_QUESTION,
  describeCodebase,
  describeModes,
  describeTarget,
  FIRST_RELEASE_FIELD,
  MODES_QUESTION,
  TECHNICAL_TARGET_FIELDS,
  TextTargetField,
} from "./primeTargets";
import { AssessmentState } from "./types";

const EMPTY = "—";

function describeChoice(choice: ChoiceAnswer | undefined, options: ChoiceOption[]): string {
  if (!choice || choice.selected.length === 0) return EMPTY;
  return choice.selected
    .map((id) => {
      if (id === NOT_SURE_ID) return "Not sure";
      if (id === OTHER_ID) return choice.other.trim() ? `Other: ${choice.other.trim()}` : "Other";
      return options.find((o) => o.id === id)?.label ?? id;
    })
    .join("; ");
}

function describeFollowUp(followUp: FollowUp, answer: FollowUpAnswer | undefined): string | null {
  if (followUp.kind === "text") return answer?.text.trim() || null;
  const text = describeChoice(answer, followUp.options);
  return text === EMPTY ? null : text;
}

function answerLines(q: DiscoveryQuestion, a: QuestionAnswer): string[] {
  if (q.type === "open") {
    if (a.text.trim()) return [a.text.trim()];
    if (a.notSureYet) return [`Not sure yet — what needs checking: ${a.needsChecking.trim() || EMPTY}`];
    return [];
  }
  if (q.type === "rows") return q.rows.map((row) => `- ${row.label}: ${describeChoice(a.rows[row.id], row.options)}`);
  return [`**Answer:** ${describeChoice(a.choice, q.options)}`];
}

function detailLines(q: DiscoveryQuestion, a: QuestionAnswer): string[] {
  const followUps = (q.followUps ?? [])
    .filter((f) => followUpVisible(f, a))
    .map((f) => [f.prompt, describeFollowUp(f, a.followUps[f.id])] as const)
    .filter(([, value]) => value)
    .map(([prompt, value]) => `- ${prompt}: ${value}`);
  const basis = BASIS_OPTIONS.find((b) => b.value === a.basis)?.label;
  return [
    ...followUps,
    a.evidence.trim() ? `- Evidence: ${a.evidence.trim()}` : "",
    basis ? `- Basis: ${basis}` : "",
    needsConfirmation(a) && a.confirmBy.trim() ? `- What would confirm it: ${a.confirmBy.trim()}` : "",
  ].filter(Boolean);
}

function fileBlocks(a: QuestionAnswer): string[] {
  return PROJECT_FILES.filter((f) => a.files[f.id]?.trim()).flatMap((f) => [`${f.label}:`, "```", a.files[f.id].trim(), "```"]);
}

function questionBlock(q: DiscoveryQuestion, a: QuestionAnswer): string[] {
  const body = isAnswered(q, a) || isNotSure(q, a) ? answerLines(q, a) : ["_Not answered_"];
  return [`### ${q.id} · ${q.prompt}`, ...(q.tags.length ? [`Tags: ${q.tags.join(", ")}`] : []), ...body, ...detailLines(q, a), ...fileBlocks(a), ""];
}

function targetLine(state: AssessmentState, field: TextTargetField): string {
  const target = state.primeTargets[field.key];
  const link = target.state === "set" ? target.link?.trim() : "";
  return `- ${field.label}: ${describeTarget(target) ?? EMPTY}${link ? ` (sketch: ${link})` : ""}`;
}

function targetLines(state: AssessmentState): string[] {
  const t = state.primeTargets;
  return [
    `- ${CODEBASE_QUESTION} ${describeCodebase(t.codebase) || EMPTY}`,
    `- ${MODES_QUESTION} ${describeModes(t).join("; ") || EMPTY}`,
    targetLine(state, FIRST_RELEASE_FIELD),
    ...TECHNICAL_TARGET_FIELDS.map((f) => targetLine(state, f)),
  ];
}

function openItems(state: AssessmentState): string[] {
  return DISCOVERY_QUESTIONS.flatMap((q) => {
    const a = answerFor(state.answers, q.id);
    if (isNotSure(q, a)) return [`- ${q.id} · ${q.prompt} (Not sure)`];
    if (!isAnswered(q, a)) return [`- ${q.id} · ${q.prompt} (not answered)`];
    return [];
  });
}

/** The whole discovery record as Markdown, in question order, ending with open items. */
export function buildDiscoveryMarkdown(state: AssessmentState, exportedAt = new Date()): string {
  const g = state.gameInfo;
  const sections = DISCOVERY_SECTIONS.flatMap((section) => [
    `## ${section.id} — ${section.title}`,
    "",
    ...DISCOVERY_QUESTIONS.filter((q) => q.section === section.id).flatMap((q) => questionBlock(q, answerFor(state.answers, q.id))),
  ]);
  const open = openItems(state);
  return [
    `# Prime discovery — ${g.gameName || "Untitled game"}`,
    `_Exported ${exportedAt.toISOString().slice(0, 10)}_`,
    "",
    "## Game information",
    `- Game name: ${g.gameName || EMPTY}`,
    `- Developer / team: ${g.developer || EMPTY}`,
    "",
    "## Prime targets",
    ...targetLines(state),
    "",
    ...sections,
    "## Unanswered / Not sure",
    ...(open.length ? open : ["- None"]),
    "",
  ].join("\n");
}
