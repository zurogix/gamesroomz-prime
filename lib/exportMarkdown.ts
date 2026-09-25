import { answerDetails, answerSummary, describeChoice, describeOpen, EMPTY } from "./answerText";
import { DISCOVERY_QUESTIONS, DISCOVERY_SECTIONS, PROJECT_FILES } from "./discovery";
import { AnswerMap, answerFor, discoveryAttention, isAnswered, isNotSure } from "./discoveryAnswers";
import { DiscoveryQuestion, QuestionAnswer } from "./discoveryTypes";
import { DISCOVERY_STATUS_LABEL, DiscoveryResponseData, DiscoveryStatus } from "./responses";
import { AssessmentState } from "./types";

/**
 * One developer's answers in an export. Only the name, status and dates are included — never emails
 * or internal ids. submittedAt: null means not submitted yet; omitted when unknown (older saved versions).
 */
export type ExportResponse = { name: string; status: DiscoveryStatus; answers: AnswerMap; submittedAt?: string | null };

/** A stored response as it appears in an export. */
export function toExportResponse(r: Pick<DiscoveryResponseData, "developerName" | "status" | "answers" | "submittedAt">): ExportResponse {
  return { name: r.developerName, status: r.status, answers: r.answers, submittedAt: r.submittedAt };
}

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

/** Why a question is an open item: Not sure, Assumption or Needs investigation (as in the rail), or not answered. */
function openReason(q: DiscoveryQuestion, answers: AnswerMap): string | null {
  const attention = discoveryAttention(answers).find((item) => item.question.id === q.id);
  if (attention) return attention.reason;
  return isAnswered(q, answerFor(answers, q.id)) ? null : "not answered";
}

function openItems(responses: ExportResponse[]): string[] {
  const named = responses.length > 1;
  return DISCOVERY_QUESTIONS.flatMap((q) =>
    responses.flatMap((r) => {
      const reason = openReason(q, r.answers);
      return reason ? [`- ${q.id} · ${q.prompt}${named ? ` — ${r.name}` : ""} (${reason})`] : [];
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

const day = (iso: string) => iso.slice(0, 10);

/** The header lines for the answers included: one developer in detail, or everyone on one line. */
function respondentLines(responses: ExportResponse[]): string[] {
  if (responses.length !== 1) return [`- Answers from: ${responses.map(byLine).join(", ") || EMPTY}`];
  const [r] = responses;
  const submitted = r.submittedAt === undefined ? [] : [`- Submitted: ${r.submittedAt ? day(r.submittedAt) : "Not submitted yet"}`];
  return [`- Developer: ${r.name}`, `- Status: ${DISCOVERY_STATUS_LABEL[r.status]}`, ...submitted];
}

/**
 * The discovery record as Markdown, in question order, ending with open items (Not sure, Assumption,
 * Needs investigation) and unanswered questions. With one response (a
 * developer's own export) each question shows the full answer; with several (product), every developer's
 * answer is listed under each question.
 */
export function buildDiscoveryMarkdown(state: AssessmentState, responses: ExportResponse[], exportedAt = new Date()): string {
  const g = state.gameInfo;
  const open = openItems(responses);
  return [
    `# Prime discovery — ${g.gameName || "Untitled game"}`,
    `_Exported ${day(exportedAt.toISOString())}_`,
    "",
    "## Game information",
    `- Game name: ${g.gameName || EMPTY}`,
    `- Developer / team: ${g.developer || EMPTY}`,
    ...respondentLines(responses),
    "",
    ...(responses.length ? sectionLines(responses) : [NO_RESPONSES, ""]),
    "## Open items",
    ...(open.length ? open : ["- None"]),
    "",
  ].join("\n");
}
