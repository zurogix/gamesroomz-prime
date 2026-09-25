import { Role } from "@/lib/permissions";
import { isPreview, Stage, stageProgress, STAGES, stageVisible, statusLabel } from "@/lib/stages";
import { AssessmentStatus } from "@/lib/types";
import LockIcon from "./LockIcon";

type Props = {
  status: AssessmentStatus;
  role: Role;
  /** The stage of the page being viewed, if any. */
  activeStage: Stage | null;
  onOpen: (stage: Stage) => void;
};

const PROGRESS_LABEL = { done: "Done", current: "Current", locked: "Locked" } as const;

/** The four stages with Done / Current / Locked, who works on each, and the current status. */
export default function ProgressStepper({ status, role, activeStage, onOpen }: Props) {
  return (
    <nav className="stepper" aria-label="Progress">
      <ol>
        {STAGES.map((stage) => {
          const progress = stageProgress(stage, status);
          const open = stageVisible(role, stage, status);
          const tag = isPreview(role, stage, status) ? "Preview" : PROGRESS_LABEL[progress];
          return (
            <li key={stage.id} className={`step ${progress} ${activeStage?.id === stage.id ? "on" : ""}`}>
              <button type="button" disabled={!open} aria-current={activeStage?.id === stage.id ? "step" : undefined} onClick={() => onOpen(stage)}>
                <span className="step-num" aria-hidden="true">{progress === "done" ? "✓" : open ? stage.number : <LockIcon />}</span>
                <span className="step-text">
                  <b>{stage.number}. {stage.title}</b>
                  <small>{stage.who}</small>
                  <em className={`step-tag ${tag.toLowerCase()}`}>{tag}</em>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
      <p className="stepper-status"><span className="label">Status</span> {statusLabel(status)}</p>
    </nav>
  );
}
