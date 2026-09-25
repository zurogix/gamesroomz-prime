import PageHeader from "@/components/PageHeader";
import { Stage } from "@/lib/stages";
import LockIcon from "./LockIcon";

/** Shown to developers instead of a stage's content until the stage opens. */
export default function LockedStage({ stage }: { stage: Stage }) {
  return (
    <>
      <PageHeader title={stage.title} crumb={<>Stage {stage.number} of 4 <span>·</span> Locked</>} />
      <div className="content">
        <section className="card locked-stage">
          <span className="locked-icon"><LockIcon size={18} /></span>
          <p>{stage.lockedMessage}</p>
        </section>
      </div>
    </>
  );
}
