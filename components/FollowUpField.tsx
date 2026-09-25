import { emptyFollowUp } from "@/lib/discoveryAnswers";
import { FollowUp, FollowUpAnswer } from "@/lib/discoveryTypes";
import ChoiceGroup from "./ChoiceGroup";

type Props = {
  followUp: FollowUp;
  value: FollowUpAnswer | undefined;
  onChange: (value: FollowUpAnswer) => void;
};

export default function FollowUpField({ followUp, value = emptyFollowUp(), onChange }: Props) {
  const titleId = `fu-${followUp.id}`;

  if (followUp.kind === "text") {
    return (
      <div className="field follow-up">
        <label htmlFor={`${titleId}-text`}>{followUp.prompt}</label>
        <input type="text" id={`${titleId}-text`} value={value.text} onChange={(e) => onChange({ ...value, text: e.target.value })} />
      </div>
    );
  }

  return (
    <div className="field follow-up">
      <span className="field-title" id={titleId}>{followUp.prompt}</span>
      <ChoiceGroup
        id={titleId}
        options={followUp.options}
        mode={followUp.kind}
        value={value}
        labelledBy={titleId}
        onChange={(choice) => onChange({ ...value, ...choice })}
      />
    </div>
  );
}
