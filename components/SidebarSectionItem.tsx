import { isQuestionDone } from "@/lib/assessment";
import { questions } from "@/lib/questions";
import { AssessmentState } from "@/lib/types";
import ProgressRing from "./ProgressRing";

type Props = { state: AssessmentState; section: string; active: boolean; onNavigate: (view: string) => void };

export default function SidebarSectionItem({ state, section, active, onNavigate }: Props) {
  const qs = questions.filter((q) => q.section === section);
  const done = qs.filter((q) => isQuestionDone(state, q)).length;
  const flagged = qs.some((q) => ["rewrite", "new"].includes(state.responses[q.id]?.classification));
  return (
    <button type="button" className={`nav-item ${active ? "on" : ""}`} aria-current={active ? "page" : undefined} onClick={() => onNavigate(section)}>
      <ProgressRing done={done} total={qs.length} />
      <span className="grow">{section}</span>
      {flagged && <span className="flag" title="Contains Rewrite or New" />}
      <span className="count">{done}/{qs.length}</span>
    </button>
  );
}
