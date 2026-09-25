import { answerDetails, answerSummary, describeChoice, describeOpen, EMPTY } from "./answerText";
import { DISCOVERY_QUESTIONS, DISCOVERY_SECTIONS, PROJECT_FILES } from "./discovery";
import { AnswerMap, answerFor, isAnswered, isNotSure } from "./discoveryAnswers";
import { DiscoveryQuestion, QuestionAnswer } from "./discoveryTypes";
import { DISCOVERY_STATUS_LABEL, DiscoveryStatus } from "./responses";
import { AssessmentState } from "./types";

/** One developer's answers in an export. */
export type ExportResponse = { name: string; status: DiscoveryStatus; answers: AnswerMap };

const NO_RESPONSES = "_No developer has started discovery yet._";

const byLine = (r: ExportResponse) => `${r.name} (${DISCOVERY_STATUS_LABEL[r.status]})`;

function answerLines(q: DiscoveryQuestion, a: QuestionAnswer): string[] {
  if (q.type === "open") return describeOpen(a) === EMPTY ? [] : [describeOpen(a)];
  if (q.type === "rows") return q.rows.map((row) => `- ${row.label}: ${describeChoice(a.rows[row.id], row.options)}`);
  return [`**Answer:** ${describeChoice(a.choice, q.options)}`];
}

function fileBlocks(a: QuestionAnswer): string[] {
  return PROJECT_FILES.filter((f) => a.files[f.id]?.trim()).flatMap((f) => [`${f.label}:`, "```", a.files[f.id].trim(), "```"]);
}

const questionHeading = (q: DiscoveryQuestion) => [`### ${q.id} · ${q.prompt}`, ...(q.tags.length ? [`Tags: ${q.tags.join(", ")}`] : [])];

/** One developer: the full answer with details and attached project files. */
function singleBlock(q: DiscoveryQuestion, a: QuestionAnswer): string[] {
  const body = isAnswered(q, a) || isNotSure(q, a) ? answerLines(q, a) : ["_Not answered_"];
  const details = answerDetails(q, a).map((d) => `- ${d.label}: ${d.value}`);
  return [...questionHeading(q), ...body, ...details, ...fileBlocks(a), ""];
}

/** Several developers: one line each ("- Alex (submitted): …"), details indented below. */
function multiBlock(q: DiscoveryQuestion, responses: ExportResponse[]): string[] {
  const lines = responses.flatMap((r) => {
    const a = answerFor(r.answers, q.id);
    const summary = isAnswered(q, a) || isNotSure(q, a) ? answerSummary(q, a) : "_Not answered_";
    return [`- ${byLine(r)}: ${summary}`, ...answerDetails(q, a).map((d) => `  - ${d.label}: ${d.value}`)];
  });
  return [...questionHeading(q), ...lines, ""];
}

function openItems(responses: ExportResponse[]): string[] {
  const named = responses.length > 1;
  return DISCOVERY_QUESTIONS.flatMap((q) =>
    responses.flatMap((r) => {
      const a = answerFor(r.answers, q.id);
      const who = named ? ` — ${r.name}` : "";
      if (isNotSure(q, a)) return [`- ${q.id} · ${q.prompt}${who} (Not sure)`];
      if (!isAnswered(q, a)) return [`- ${q.id} · ${q.prompt}${who} (not answered)`];
      return [];
    }),
  );
}

function sectionLines(responses: ExportResponse[]): string[] {
  const single = responses.length === 1;
  return DISCOVERY_SECTIONS.flatMap((section) => [
    `## ${section.id} — ${section.title}`,
    "",
    ...DISCOVERY_QUESTIONS.filter((q) => q.section === section.id).flatMap((q) =>
      single ? singleBlock(q, answerFor(responses[0].answers, q.id)) : multiBlock(q, responses),
    ),
  ]);
}

/**
 * The discovery record as Markdown, in question order, ending with open items. With one response (a
 * developer's own export) each question shows the full answer; with several (product), every developer's
 * answer is listed under each question.
 */
export function buildDiscoveryMarkdown(state: AssessmentState, responses: ExportResponse[], exportedAt = new Date()): string {
  const g = state.gameInfo;
  const open = openItems(responses);
  return [
    `# Prime discovery — ${g.gameName || "Untitled game"}`,
    `_Exported ${exportedAt.toISOString().slice(0, 10)}_`,
    "",
    "## Game information",
    `- Game name: ${g.gameName || EMPTY}`,
    `- Developer / team: ${g.developer || EMPTY}`,
    `- Answers from: ${responses.map(byLine).join(", ") || EMPTY}`,
    "",
    ...(responses.length ? sectionLines(responses) : [NO_RESPONSES, ""]),
    "## Unanswered / Not sure",
    ...(open.length ? open : ["- None"]),
    "",
  ].join("\n");
}
