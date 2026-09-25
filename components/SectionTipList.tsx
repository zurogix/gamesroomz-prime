import { DISCOVERY_QUESTIONS, NOT_SURE_TIP } from "@/lib/discovery";
import { DiscoverySection } from "@/lib/discoveryTypes";
import { focusQuestion } from "@/lib/rail";

/** Section intro plus one "why we ask" line per question; each line jumps to its question. */
export default function SectionTipList({ section }: { section: DiscoverySection }) {
  const questions = DISCOVERY_QUESTIONS.filter((q) => q.section === section.id);
  return (
    <div className="tip-list">
      <p className="tip-intro">{section.intro}</p>
      <ul>
        {questions.map((q) => (
          <li key={q.id}>
            <button type="button" onClick={() => focusQuestion(q.id)}>
              <b>{q.id} · {q.title}</b> — {q.why}
            </button>
          </li>
        ))}
      </ul>
      <p className="hint">{NOT_SURE_TIP}</p>
    </div>
  );
}
