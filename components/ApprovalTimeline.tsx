import { STATUS_STEPS } from "@/lib/sections";
import { AssessmentState } from "@/lib/types";

type Props = {
  status: AssessmentState["status"];
  onChange: (status: AssessmentState["status"]) => void;
};

export default function ApprovalTimeline({ status, onChange }: Props) {
  const current = STATUS_STEPS.findIndex((s) => s.value === status);
  return (
    <div className="timeline" role="group" aria-label="Approval status">
      {STATUS_STEPS.map((step, i) => {
        const classes = [
          i < current ? "past" : "",
          i === current ? "cur" : "",
          i === current && step.value === "changes-requested" ? "alert" : "",
        ].join(" ");
        return (
          <button key={step.value} type="button" className={classes} aria-pressed={i === current} onClick={() => onChange(step.value)}>
            <span className="dot"><i /></span>
            {step.label}
          </button>
        );
      })}
    </div>
  );
}
