import { discoveryCoverage } from "@/lib/discoveryAnswers";
import { currentStage, stageSummary } from "@/lib/stages";
import { AssessmentState } from "@/lib/types";

/** Top of the rail: the current step and status, plus how much of discovery is answered while in step 1. */
export default function RailStageProgress({ state }: { state: AssessmentState }) {
  const inDiscovery = currentStage(state.status).id === "discovery";
  const percent = discoveryCoverage(state.answers);

  return (
    <section className="rail-stage" aria-live="polite">
      <span className="label">Progress</span>
      <p>{stageSummary(state.status)}</p>
      {inDiscovery && (
        <div className="rail-progress-item">
          <div className="progress-line">
            <span>Discovery answered</span>
            <span className="num">{percent}%</span>
          </div>
          <div className="bar"><i style={{ width: `${percent}%` }} /></div>
        </div>
      )}
    </section>
  );
}
