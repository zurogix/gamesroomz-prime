import { allowedTransitions, Role } from "./permissions";
import { publishFindingsRefusal } from "./responses";
import type { AssessmentState, AssessmentStatus } from "./types";

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
  "discovery>findings": {
    label: "Publish findings",
    title: "Publish findings?",
    text: "Developers will see the findings and options and can comment on the engine comparison. Discovery answers can no longer be changed.",
    primary: true,
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
    text: "The plan goes back to the developer to edit, confirm and submit again. Their confirmation ticks are cleared.",
    primary: false,
  },
  "agreed>plan": {
    label: "Reopen plan",
    title: "Reopen the plan?",
    text: "The plan goes back to in progress and must be confirmed, submitted and agreed again. The developer's confirmation ticks are cleared.",
    primary: false,
  },
};

/** The buttons this role sees for the current status, in the order they should appear. */
export function stageActionsFor(role: Role, status: AssessmentStatus): StageAction[] {
  return allowedTransitions(role, status).map((to) => ({ to, ...COPY[`${status}>${to}`] }));
}

/** A developer submitting their own discovery answers (not a game status change). */
export const SUBMIT_DISCOVERY = {
  label: "Submit discovery",
  title: "Submit discovery?",
  text: "Your answers become read-only while the product team reviews them.",
};

export const UNANSWERED_TITLE = "A few questions still need an answer";
export const NOT_SURE_NOTE = "'Not sure' is a valid answer — it will be discussed as an open item.";

/** What the game needs for a status change, beyond permissions (checked on the server too). */
export type TransitionContext = { submittedResponses: number };

/** "Publish findings" (discovery → findings) needs at least one developer's submitted discovery. */
export function transitionRequirementError(from: AssessmentStatus, next: AssessmentState, context: TransitionContext): string | null {
  if (from === "discovery" && next.status === "findings") return publishFindingsRefusal(context.submittedResponses);
  return null;
}

/** Sending the plan back to the developer clears their confirmations so they confirm again before resubmitting. */
const CLEARS_CHECKS = new Set(["plan-submitted>plan", "agreed>plan"]);

/** Side effects of moving from one status to the next state's status (used by the editor and the save route). */
export function withTransitionEffects(from: AssessmentStatus, next: AssessmentState): AssessmentState {
  if (!CLEARS_CHECKS.has(`${from}>${next.status}`)) return next;
  return { ...next, checks: next.checks.map(() => false) };
}

export function applyStatusChange(state: AssessmentState, to: AssessmentStatus): AssessmentState {
  return withTransitionEffects(state.status, { ...state, status: to });
}
