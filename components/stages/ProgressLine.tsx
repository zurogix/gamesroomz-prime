import { Stage, stageProgress, statusLabel } from "@/lib/stages";
import { AssessmentStatus } from "@/lib/types";

type Props = {
  stages: Stage[];
  status: AssessmentStatus;
  /** The stage of the page being viewed, if any. */
  activeStage: Stage | null;
  onOpen: (stage: Stage) => void;
};

/** "Step 1: Discovery › Step 2: Findings & options", showing only open stages; the current one is highlighted. */
export default function ProgressLine({ stages, status, activeStage, onOpen }: Props) {
  return (
    <nav className="progress-line-nav" aria-label="Progress">
      <ol>
        {stages.map((stage) => {
          const progress = stageProgress(stage, status);
          const classes = ["progress-step", progress, activeStage?.id === stage.id ? "on" : ""].join(" ");
          return (
            <li key={stage.id} className={classes}>
              <button type="button" aria-current={progress === "current" ? "step" : undefined} onClick={() => onOpen(stage)}>
                Step {stage.number}: {stage.title}
              </button>
            </li>
          );
        })}
      </ol>
      <span className="progress-status">{statusLabel(status)}</span>
    </nav>
  );
}
