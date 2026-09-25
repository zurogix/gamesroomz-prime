import type { Role } from "./permissions";
import { WHAT_HAPPENS_NEXT } from "./stages";
import type { AssessmentStatus } from "./types";

const BY_ROLE: Partial<Record<AssessmentStatus, Record<Role, string>>> = {
  discovery: {
    product: "Invite the developer from Team, then share the portal link.",
    developer: "Start with section A. Allow approximately 1.5–2 hours; 'Not sure' is fine.",
  },
  "discovery-submitted": {
    product: "Review the answers, then publish findings or reopen discovery for follow-up questions.",
    developer: WHAT_HAPPENS_NEXT,
  },
};

const FOR_EVERYONE: Partial<Record<AssessmentStatus, string>> = {
  findings: "The developer comments on the findings and options; the product team then opens the conversion plan.",
  plan: "The developer confirms or edits the pre-filled plan, then submits it for review.",
  "plan-submitted": "The product team reviews the plan, then agrees it or requests changes.",
  agreed: "The plan is agreed. Everyone can read the Management Summary.",
};

/** The Overview's "Next step" text for this role and status. */
export function nextStepText(role: Role, status: AssessmentStatus): string {
  return BY_ROLE[status]?.[role] ?? FOR_EVERYONE[status] ?? "";
}
