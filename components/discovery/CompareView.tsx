import PageHeader from "@/components/PageHeader";
import { DISCOVERY_QUESTIONS, DISCOVERY_SECTIONS } from "@/lib/discovery";
import { DiscoveryResponseData } from "@/lib/responses";
import CompareQuestion from "./CompareQuestion";
import { NO_RESPONSES_YET } from "./DeveloperPicker";

/** Product: every discovery question in order with each developer's answer side by side. */
export default function CompareView({ responses }: { responses: DiscoveryResponseData[] }) {
  const crumb = <>Discovery <span>·</span> {responses.length} {responses.length === 1 ? "developer" : "developers"}</>;
  return (
    <>
      <PageHeader title="Compare answers" crumb={crumb} />
      <div className="content">
        {responses.length === 0 && <p className="hint">{NO_RESPONSES_YET}</p>}
        {responses.length > 0 && DISCOVERY_SECTIONS.map((section) => (
          <section key={section.id} className="compare-section">
            <h2>{section.id} · {section.title}</h2>
            {DISCOVERY_QUESTIONS.filter((q) => q.section === section.id).map((q) => (
              <CompareQuestion key={q.id} question={q} responses={responses} />
            ))}
          </section>
        ))}
      </div>
    </>
  );
}
