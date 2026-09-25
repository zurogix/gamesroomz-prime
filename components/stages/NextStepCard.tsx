import { nextStepText } from "@/lib/nextStep";
import { Role } from "@/lib/permissions";
import { currentStage, Stage, stageVisible } from "@/lib/stages";
import { AssessmentStatus } from "@/lib/types";

type Props = { role: Role; status: AssessmentStatus; onOpen: (stage: Stage) => void };

/** The Overview's "Next step": who acts next, with a link to the current stage. */
export default function NextStepCard({ role, status, onOpen }: Props) {
  const stage = currentStage(status);
  return (
    <section className="resume next-step">
      <div>
        <b>Next step</b>
        <p>{nextStepText(role, status)}</p>
      </div>
      {stageVisible(role, stage, status) && (
        <button type="button" className="btn" onClick={() => onOpen(stage)}>Go to {stage.title} →</button>
      )}
    </section>
  );
}
