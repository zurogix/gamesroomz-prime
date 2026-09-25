import { nextStepText } from "@/lib/nextStep";
import { Role } from "@/lib/permissions";
import type { DiscoveryStatus } from "@/lib/responses";
import { currentStage, Stage } from "@/lib/stages";
import { AssessmentStatus } from "@/lib/types";

type Props = { role: Role; status: AssessmentStatus; ownDiscovery?: DiscoveryStatus; onOpen: (stage: Stage) => void };

/** The Overview's "Next step": who acts next, with a link to the current stage (always open). */
export default function NextStepCard({ role, status, ownDiscovery, onOpen }: Props) {
  const stage = currentStage(status);
  return (
    <section className="resume next-step">
      <div>
        <b>Next step</b>
        <p>{nextStepText(role, status, ownDiscovery)}</p>
      </div>
      <button type="button" className="btn" onClick={() => onOpen(stage)}>Go to {stage.title} →</button>
    </section>
  );
}
