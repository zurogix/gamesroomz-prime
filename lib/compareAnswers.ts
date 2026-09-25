import { isAnswered } from "./discoveryAnswers";
import { ChoiceAnswer, DiscoveryQuestion, QuestionAnswer } from "./discoveryTypes";

const selection = (choice: ChoiceAnswer | undefined) => [...(choice?.selected ?? [])].sort().join(",");

/** What was selected, ignoring order and free text; open questions have no options to compare. */
function selectionKey(q: DiscoveryQuestion, a: QuestionAnswer): string | null {
  if (q.type === "open") return null;
  if (q.type === "rows") return q.rows.map((row) => `${row.id}=${selection(a.rows[row.id])}`).join("|");
  return selection(a.choice);
}

/**
 * True when developers who answered picked different options ("Answers differ"). Unanswered responses
 * and open (text) questions are not compared.
 */
export function answersDiffer(q: DiscoveryQuestion, answers: QuestionAnswer[]): boolean {
  const keys = answers.filter((a) => isAnswered(q, a)).map((a) => selectionKey(q, a));
  if (keys.some((k) => k === null)) return false;
  return new Set(keys).size > 1;
}
