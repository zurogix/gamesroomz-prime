import { planCoverage } from "@/lib/assessment";
import { DISCOVERY_SECTIONS } from "@/lib/discovery";
import { discoveryCoverage, sectionProgress } from "@/lib/discoveryAnswers";
import { railKindFor } from "@/lib/rail";
import { AssessmentState } from "@/lib/types";
import RailFollowUp from "./RailFollowUp";
import RailPlanSummary from "./RailPlanSummary";
import RailProgress from "./RailProgress";
import RailStageProgress from "./RailStageProgress";
import RailSectionTips from "./RailSectionTips";

type Props = {
  view: string;
  state: AssessmentState;
  onJumpToQuestion: (id: string) => void;
  onOpenWorkstream: (id: string) => void;
};

/** The right-hand rail changes with the page and always starts with the Progress box; some pages have no rail. */
export default function PageRail({ view, state, onJumpToQuestion, onOpenWorkstream }: Props) {
  const kind = railKindFor(view);
  if (kind === "none") return null;

  const discovery = { label: "Discovery overall", percent: discoveryCoverage(state.answers) };
  const followUp = <RailFollowUp answers={state.answers} onJumpToQuestion={onJumpToQuestion} />;
  const stageProgress = <RailStageProgress state={state} />;

  if (kind === "plan") {
    return (
      <aside className="rail" aria-label="Plan summary">
        {stageProgress}
        <RailPlanSummary state={state} onOpenWorkstream={onOpenWorkstream} />
      </aside>
    );
  }

  if (kind === "overview") {
    return (
      <aside className="rail" aria-label="Progress">
        {stageProgress}
        <RailProgress lines={[{ ...discovery, label: "Discovery" }, { label: "Plan", percent: planCoverage(state) }]} />
        {followUp}
      </aside>
    );
  }

  const section = DISCOVERY_SECTIONS.find((s) => s.title === view)!;
  const { done, total } = sectionProgress(state.answers, section.id);
  const sectionLine = { label: "This section", percent: Math.round((done / total) * 100), detail: `${done} of ${total} answered` };

  return (
    <aside className="rail" aria-label="About this section">
      {stageProgress}
      <RailSectionTips section={section} />
      <RailProgress lines={[sectionLine, discovery]} />
      {followUp}
    </aside>
  );
}
