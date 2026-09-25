import { AnswerMap, discoveryAttention, sectionProgress } from "@/lib/discoveryAnswers";
import { DiscoverySection } from "@/lib/discoveryTypes";
import ProgressRing from "./ProgressRing";

type Props = { answers: AnswerMap; section: DiscoverySection; active: boolean; onNavigate: (view: string) => void };

export default function SidebarSectionItem({ answers, section, active, onNavigate }: Props) {
  const { done, total } = sectionProgress(answers, section.id);
  const hasOpenItems = discoveryAttention(answers).some((item) => item.question.section === section.id);
  return (
    <button type="button" className={`nav-item ${active ? "on" : ""}`} aria-current={active ? "page" : undefined} onClick={() => onNavigate(section.title)}>
      <ProgressRing done={done} total={total} />
      <span className="grow">{section.id} · {section.title}</span>
      {hasOpenItems && <span className="flag flag-open" title="Has open items (Not sure, Assumption or Needs investigation)" />}
      <span className="count">{done}/{total}</span>
    </button>
  );
}
