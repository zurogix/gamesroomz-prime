import { answerDetails, answerSummary } from "@/lib/answerText";
import { answersDiffer } from "@/lib/compareAnswers";
import { answerFor, isAnswered, isNotSure } from "@/lib/discoveryAnswers";
import { DiscoveryQuestion } from "@/lib/discoveryTypes";
import { DISCOVERY_STATUS_LABEL, DiscoveryResponseData } from "@/lib/responses";

type Props = { question: DiscoveryQuestion; responses: DiscoveryResponseData[] };

const COMPARED_DETAILS = new Set(["Basis", "Evidence"]);

/** One question with each developer's answer side by side; flags "Answers differ" when the options differ. */
export default function CompareQuestion({ question: q, responses }: Props) {
  const answers = responses.map((r) => answerFor(r.answers, q.id));
  const differ = answersDiffer(q, answers);

  return (
    <article className={`dq compare-q ${differ ? "differs" : ""}`}>
      <header className="dq-head">
        <span className="dq-id">{q.id}</span>
        <p className="dq-prompt">{q.prompt}</p>
        <div className="dq-tags">{differ && <span className="tag tag-missing">Answers differ</span>}</div>
      </header>
      <div className="compare-grid">
        {responses.map((r, i) => {
          const a = answers[i];
          const answered = isAnswered(q, a) || isNotSure(q, a);
          return (
            <div key={r.id} className="compare-cell">
              <b>{r.developerName}</b> <small className="hint">{DISCOVERY_STATUS_LABEL[r.status]}</small>
              <p className={answered ? "" : "hint"}>{answered ? answerSummary(q, a) : "Not answered"}</p>
              {answerDetails(q, a).filter((d) => COMPARED_DETAILS.has(d.label)).map((d) => (
                <small key={d.label} className="compare-detail">{d.label}: {d.value}</small>
              ))}
            </div>
          );
        })}
      </div>
    </article>
  );
}
