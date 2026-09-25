import { allowedTransitions, Role } from "./permissions";
import type { AssessmentStatus } from "./types";

export type StageAction = {
  to: AssessmentStatus;
  label: string;
  /** Dialog title and text shown before the change is made. */
  title: string;
  text: string;
  primary: boolean;
};

type Copy = Omit<StageAction, "to">;

const COPY: Record<string, Copy> = {
  "discovery>discovery-submitted": {
    label: "Submit discovery",
    title: "Submit discovery?",
    text: "The product team will review your answers. Your answers become read-only while they are reviewed.",
    primary: true,
  },
  "discovery-submitted>findings": {
    label: "Publish findings",
    title: "Publish findings?",
    text: "The developer will see the findings and options and can comment on the engine comparison.",
    primary: true,
  },
  "discovery-submitted>discovery": {
    label: "Reopen discovery",
    title: "Reopen discovery?",
    text: "The developer can edit the discovery answers again, e.g. to answer follow-up questions.",
    primary: false,
  },
  "findings>plan": {
    label: "Options agreed — open plan",
    title: "Open the conversion plan?",
    text: "The developer can confirm or edit the pre-filled workstreams and submit the plan.",
    primary: true,
  },
  "plan>plan-submitted": {
    label: "Submit plan",
    title: "Submit the plan?",
    text: "The product team will review the plan. Confirm each point below first.",
    primary: true,
  },
  "plan-submitted>agreed": {
    label: "Agree plan",
    title: "Agree the plan?",
    text: "The plan is marked as agreed and the Management Summary opens for everyone.",
    primary: true,
  },
  "plan-submitted>plan": {
    label: "Request changes",
    title: "Request changes?",
    text: "The plan goes back to the developer to edit and submit again.",
    primary: false,
  },
  "agreed>plan": {
    label: "Reopen plan",
    title: "Reopen the plan?",
    text: "The plan goes back to in progress and must be submitted and agreed again.",
    primary: false,
  },
};

/** The buttons this role sees for the current status, in the order they should appear. */
export function stageActionsFor(role: Role, status: AssessmentStatus): StageAction[] {
  return allowedTransitions(role, status).map((to) => ({ to, ...COPY[`${status}>${to}`] }));
}

export const UNANSWERED_NOTE = "Unanswered questions will be listed as open items for discussion.";
