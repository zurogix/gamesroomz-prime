import { STATUS_STEPS } from "@/lib/sections";
import { AssessmentState } from "@/lib/types";

type Props = {
  status: AssessmentState["status"];
  onChange: (status: AssessmentState["status"]) => void;
  /** Statuses this user may set; the others are shown but disabled. */
  allowed: AssessmentState["status"][];
};

export default function AgreementTimeline({ status, onChange, allowed }: Props) {
  const current = STATUS_STEPS.findIndex((s) => s.value === status);
  return (
    <div className="timeline" role="group" aria-label="Agreement status">
      {STATUS_STEPS.map((step, i) => {
        const classes = [
          i < current ? "past" : "",
          i === current ? "cur" : "",
          i === current && step.value === "changes-requested" ? "alert" : "",
        ].join(" ");
        return (
          <button
            key={step.value}
            type="button"
            className={classes}
            aria-pressed={i === current}
            disabled={!allowed.includes(step.value)}
            title={allowed.includes(step.value) ? undefined : "Set by the product team"}
            onClick={() => onChange(step.value)}
          >
            <span className="dot"><i /></span>
            {step.label}
          </button>
        );
      })}
    </div>
  );
}
