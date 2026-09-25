import { emptyChoice, followUpVisible, isAnswered } from "@/lib/discoveryAnswers";
import { questionElementId } from "@/lib/rail";
import { DiscoveryQuestion, QuestionAnswer } from "@/lib/discoveryTypes";
import BasisField from "./BasisField";
import ChoiceGroup from "./ChoiceGroup";
import EvidenceField from "./EvidenceField";
import FollowUpField from "./FollowUpField";
import OpenAnswer from "./OpenAnswer";
import ProjectFilesField from "./ProjectFilesField";
import TagChips from "./TagChips";

type Props = {
  question: DiscoveryQuestion;
  answer: QuestionAnswer;
  onChange: (update: (answer: QuestionAnswer) => QuestionAnswer) => void;
};

export default function DiscoveryQuestionCard({ question: q, answer, onChange }: Props) {
  const titleId = `q-${q.id}`;
  const patch = (p: Partial<QuestionAnswer>) => onChange((a) => ({ ...a, ...p }));
  const answered = isAnswered(q, answer);

  return (
    <article className={`dq ${answered ? "answered" : ""}`} id={questionElementId(q.id)} tabIndex={-1} aria-labelledby={titleId}>
      <header className="dq-head">
        <span className="dq-id">{q.id}</span>
        <div>
          <p className="dq-prompt" id={titleId}>{q.prompt}</p>
          {q.helper && <small className="dq-helper">{q.helper}</small>}
        </div>
        <TagChips tags={q.tags} />
      </header>

      <div className="dq-body">
        {(q.type === "single" || q.type === "multi") && (
          <ChoiceGroup id={q.id} options={q.options} mode={q.type} value={answer.choice} labelledBy={titleId} onChange={(choice) => patch({ choice })} />
        )}

        {q.type === "rows" && q.rows.map((row) => {
          const rowTitle = `${q.id}-${row.id}`;
          return (
            <div className="dq-row" key={row.id}>
              <span className="field-title" id={rowTitle}>{row.label}</span>
              <ChoiceGroup
                id={rowTitle}
                options={row.options}
                mode={row.mode}
                value={answer.rows[row.id] ?? emptyChoice()}
                labelledBy={rowTitle}
                onChange={(choice) => onChange((a) => ({ ...a, rows: { ...a.rows, [row.id]: choice } }))}
              />
            </div>
          );
        })}

        {q.type === "open" && <OpenAnswer id={q.id} answer={answer} labelledBy={titleId} onChange={patch} />}

        {q.projectFiles && (
          <ProjectFilesField files={answer.files} onChange={(fileId, text) => onChange((a) => ({ ...a, files: { ...a.files, [fileId]: text } }))} />
        )}

        {(q.followUps ?? []).filter((f) => followUpVisible(f, answer)).map((f) => (
          <FollowUpField
            key={f.id}
            followUp={f}
            value={answer.followUps[f.id]}
            onChange={(value) => onChange((a) => ({ ...a, followUps: { ...a.followUps, [f.id]: value } }))}
          />
        ))}

        <EvidenceField id={q.id} evidence={q.evidence} hint={q.evidenceHint} value={answer.evidence} onChange={(evidence) => patch({ evidence })} />
        {answered && <BasisField id={q.id} answer={answer} onChange={patch} />}
      </div>
    </article>
  );
}
