import type { Role } from "./permissions";
import type { DiscoveryStatus } from "./responses";
import { WHAT_HAPPENS_NEXT } from "./stages";
import type { AssessmentStatus } from "./types";

const BY_ROLE: Partial<Record<AssessmentStatus, Record<Role, string>>> = {
  discovery: {
    product: "Create the developers' accounts on Team and share the portal link. Publish findings once at least one developer has submitted.",
    developer: "Start with section A. Allow approximately 1.5–2 hours; 'Not sure' is fine.",
  },
};

const FOR_EVERYONE: Partial<Record<AssessmentStatus, string>> = {
  findings: "The developer comments on the findings and options; the product team then opens the conversion plan.",
  plan: "The developer confirms or edits the pre-filled plan, then submits it for review.",
  "plan-submitted": "The product team reviews the plan, then agrees it or requests changes.",
  agreed: "The plan is agreed. Everyone can read the Management Summary.",
};

/** The Overview's "Next step" text for this role and status (and, for a developer, their own discovery). */
export function nextStepText(role: Role, status: AssessmentStatus, ownDiscovery?: DiscoveryStatus): string {
  if (role === "developer" && status === "discovery" && ownDiscovery === "submitted") return WHAT_HAPPENS_NEXT;
  return BY_ROLE[status]?.[role] ?? FOR_EVERYONE[status] ?? "";
}
