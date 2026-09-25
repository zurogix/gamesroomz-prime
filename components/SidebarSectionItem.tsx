import { DISCOVERY_QUESTIONS } from "@/lib/discovery";
import { answerFor, isNotSure, sectionProgress } from "@/lib/discoveryAnswers";
import { DiscoverySection } from "@/lib/discoveryTypes";
import { AssessmentState } from "@/lib/types";
import ProgressRing from "./ProgressRing";

type Props = { state: AssessmentState; section: DiscoverySection; active: boolean; onNavigate: (view: string) => void };

export default function SidebarSectionItem({ state, section, active, onNavigate }: Props) {
  const { done, total } = sectionProgress(state.answers, section.id);
  const hasOpenItems = DISCOVERY_QUESTIONS.some((q) => q.section === section.id && isNotSure(q, answerFor(state.answers, q.id)));
  return (
    <button type="button" className={`nav-item ${active ? "on" : ""}`} aria-current={active ? "page" : undefined} onClick={() => onNavigate(section.title)}>
      <ProgressRing done={done} total={total} />
      <span className="grow">{section.id} · {section.title}</span>
      {hasOpenItems && <span className="flag flag-open" title="Has Not sure answers to follow up" />}
      <span className="count">{done}/{total}</span>
    </button>
  );
}
