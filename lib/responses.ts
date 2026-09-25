import { canSubmitDiscovery, type AnswerMap } from "./discoveryAnswers";
import type { Role } from "./permissions";
import type { AssessmentStatus } from "./types";

/** Each developer's discovery answers for a game are kept separately and submitted on their own. */
export type DiscoveryStatus = "in-progress" | "submitted";

export type DiscoveryResponseData = {
  id: string;
  profileId: string;
  developerName: string;
  status: DiscoveryStatus;
  submittedAt: string | null;
  answers: AnswerMap;
  version: number;
};

export const DISCOVERY_STATUS_LABEL: Record<DiscoveryStatus, string> = {
  "in-progress": "in progress",
  submitted: "submitted",
};

export type Viewer = { id: string; role: Role };
type ResponseRef = { profileId: string; status: DiscoveryStatus };

/** Why a request is refused: the HTTP status and the message for the user. */
export type Refusal = { status: 400 | 403; error: string };

export const PRODUCT_ONLY = "Only the product team can do this.";
export const OWN_RESPONSE_DEVELOPERS_ONLY = "Only developers answer discovery; the product team can view everyone's answers.";
export const NOT_YOUR_RESPONSE = "You can only change your own answers.";
export const RESPONSE_SUBMITTED = "Your discovery is submitted. Ask the product team to reopen it if you need to change something.";
export const DISCOVERY_CLOSED = "Discovery answers can only be changed while discovery is in progress.";
export const UNANSWERED_ERROR = "Some questions still need an answer.";
export const REOPEN_ONLY_SUBMITTED = "Only submitted answers can be reopened.";
export const REOPEN_ONLY_DURING_DISCOVERY = "Answers can only be reopened while discovery is in progress.";
export const ANSWERS_CONFLICT = "Your answers were changed in another tab or window.";
export const PUBLISH_NEEDS_SUBMISSION = "At least one developer must submit discovery before findings can be published.";

/** Product reads every response; a developer reads only their own. */
export function canReadResponse(viewer: Viewer, response: Pick<ResponseRef, "profileId">) {
  return viewer.role === "product" || response.profileId === viewer.id;
}

/** Only developers have an own response (created on first access). */
export function ownResponseRefusal(viewer: Viewer): Refusal | null {
  return viewer.role === "developer" ? null : { status: 403, error: OWN_RESPONSE_DEVELOPERS_ONLY };
}

/**
 * Changing answers: a developer's own response only, while it is in progress and the game is in
 * discovery. Product never edits a developer's answers.
 */
export function editResponseRefusal(viewer: Viewer, response: ResponseRef, gameStatus: AssessmentStatus): Refusal | null {
  const own = ownResponseRefusal(viewer);
  if (own) return own;
  if (response.profileId !== viewer.id) return { status: 403, error: NOT_YOUR_RESPONSE };
  if (response.status === "submitted") return { status: 403, error: RESPONSE_SUBMITTED };
  if (gameStatus !== "discovery") return { status: 403, error: DISCOVERY_CLOSED };
  return null;
}

/** Submitting: as for editing, and every question must be answered ("Not sure" counts). */
export function submitResponseRefusal(viewer: Viewer, response: ResponseRef & { answers: AnswerMap }, gameStatus: AssessmentStatus): Refusal | null {
  const edit = editResponseRefusal(viewer, response, gameStatus);
  if (edit) return edit;
  return canSubmitDiscovery(response.answers) ? null : { status: 400, error: UNANSWERED_ERROR };
}

/** Listing, reopening and removing responses are for the product team. */
export function manageResponsesRefusal(viewer: Viewer): Refusal | null {
  return viewer.role === "product" ? null : { status: 403, error: PRODUCT_ONLY };
}

export function reopenResponseRefusal(viewer: Viewer, response: ResponseRef, gameStatus: AssessmentStatus): Refusal | null {
  const manage = manageResponsesRefusal(viewer);
  if (manage) return manage;
  if (response.status !== "submitted") return { status: 400, error: REOPEN_ONLY_SUBMITTED };
  if (gameStatus !== "discovery") return { status: 400, error: REOPEN_ONLY_DURING_DISCOVERY };
  return null;
}

/** "Publish findings" needs at least one developer's submitted discovery. */
export function publishFindingsRefusal(submittedResponses: number): string | null {
  return submittedResponses > 0 ? null : PUBLISH_NEEDS_SUBMISSION;
}

/** The Management Summary's discovery figure: product sees how many developers submitted; a developer sees their own status. */
export function discoveryKpi(role: Role, own: DiscoveryResponseData | null, responses: DiscoveryResponseData[]) {
  if (role === "developer") return { value: own?.status === "submitted" ? "Submitted" : "In progress", detail: "your discovery" };
  const submitted = responses.filter((r) => r.status === "submitted").length;
  return { value: `${submitted} of ${responses.length}`, detail: "developers submitted discovery" };
}
