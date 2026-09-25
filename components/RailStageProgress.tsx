import { AnswerMap, discoveryCoverage } from "@/lib/discoveryAnswers";
import { currentStage, stageSummary } from "@/lib/stages";
import type { DiscoveryStatus } from "@/lib/responses";
import { AssessmentState } from "@/lib/types";

/** Top of the rail: the current step and status; in step 1 also how much of discovery is answered (or submitted, for product). */
type Props = {
  state: AssessmentState;
  answers: AnswerMap;
  /** The developer's own discovery; product has none. */
  ownDiscovery?: DiscoveryStatus;
  /** Product in step 1: e.g. "Developers submitted: 1 of 2". */
  productNote?: string;
};

export default function RailStageProgress({ state, answers, ownDiscovery, productNote }: Props) {
  const inDiscovery = currentStage(state.status).id === "discovery";
  const percent = discoveryCoverage(answers);

  return (
    <section className="rail-stage" aria-live="polite">
      <span className="label">Progress</span>
      <p>{stageSummary(state.status, ownDiscovery)}</p>
      {inDiscovery && productNote && <small className="rail-stage-note">{productNote}</small>}
      {inDiscovery && !productNote && (
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
