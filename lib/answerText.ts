import { BASIS_OPTIONS, followUpVisible, needsConfirmation, NOT_SURE_ID, OTHER_ID } from "./discoveryAnswers";
import { ChoiceAnswer, ChoiceOption, DiscoveryQuestion, FollowUp, FollowUpAnswer, QuestionAnswer } from "./discoveryTypes";

export const EMPTY = "—";

/** Selected options as text, with the "Other" text and "Not sure". */
export function describeChoice(choice: ChoiceAnswer | undefined, options: ChoiceOption[]): string {
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

/** An open answer: the text, or "Not sure yet" plus what would need checking when given. */
export function describeOpen(a: QuestionAnswer): string {
  if (a.text.trim()) return a.text.trim();
  if (!a.notSureYet) return EMPTY;
  return a.needsChecking.trim() ? `Not sure yet — would need to check: ${a.needsChecking.trim()}` : "Not sure yet";
}

/** The answer on one line (rows joined with " | "), e.g. for comparing developers side by side. */
export function answerSummary(q: DiscoveryQuestion, a: QuestionAnswer): string {
  if (q.type === "open") return describeOpen(a);
  if (q.type === "rows") return q.rows.map((row) => `${row.label}: ${describeChoice(a.rows[row.id], row.options)}`).join(" | ");
  return describeChoice(a.choice, q.options);
}

export type AnswerDetail = { label: string; value: string };

/** Follow-ups, evidence, basis and how it could be checked — only the parts that were filled in. */
export function answerDetails(q: DiscoveryQuestion, a: QuestionAnswer): AnswerDetail[] {
  const followUps = (q.followUps ?? [])
    .filter((f) => followUpVisible(f, a))
    .map((f) => ({ label: f.prompt, value: describeFollowUp(f, a.followUps[f.id]) ?? "" }));
  const basis = BASIS_OPTIONS.find((b) => b.value === a.basis)?.label ?? "";
  return [
    ...followUps,
    { label: "Evidence", value: a.evidence.trim() },
    { label: "Basis", value: basis },
    { label: "How could this be checked", value: needsConfirmation(a) ? a.confirmBy.trim() : "" },
  ].filter((d) => d.value);
}
