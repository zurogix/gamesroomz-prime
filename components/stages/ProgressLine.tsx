import { isPreview, Stage, stageProgress, statusLabel } from "@/lib/stages";
import { Role } from "@/lib/permissions";
import { AssessmentStatus } from "@/lib/types";

type Props = {
  stages: Stage[];
  status: AssessmentStatus;
  role: Role;
  previewUpcoming: boolean;
  /** The stage of the page being viewed, if any. */
  activeStage: Stage | null;
  onOpen: (stage: Stage) => void;
};

/** "Step 1: Discovery › Step 2: Findings & options", showing only open stages; the current one is highlighted. */
export default function ProgressLine({ stages, status, role, previewUpcoming, activeStage, onOpen }: Props) {
  return (
    <nav className="progress-line-nav" aria-label="Progress">
      <ol>
        {stages.map((stage) => {
          const progress = stageProgress(stage, status);
          const preview = isPreview(role, stage, status, previewUpcoming);
          const classes = ["progress-step", progress, activeStage?.id === stage.id ? "on" : ""].join(" ");
          return (
            <li key={stage.id} className={classes}>
              <button type="button" aria-current={progress === "current" ? "step" : undefined} onClick={() => onOpen(stage)}>
                Step {stage.number}: {stage.title}
                {preview && <span className="preview-tag">Preview</span>}
              </button>
            </li>
          );
        })}
      </ol>
      <span className="progress-status">{statusLabel(status)}</span>
    </nav>
  );
}
