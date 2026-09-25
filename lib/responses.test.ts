import { describe, expect, it } from "vitest";
import {
  canReadResponse,
  discoveryKpi,
  DISCOVERY_CLOSED,
  editResponseRefusal,
  manageResponsesRefusal,
  NOT_YOUR_RESPONSE,
  OWN_RESPONSE_DEVELOPERS_ONLY,
  ownResponseRefusal,
  PRODUCT_ONLY,
  reopenResponseRefusal,
  RESPONSE_SUBMITTED,
} from "./responses";
import { STATUSES } from "./stages";

const alex = { id: "alex", role: "developer" as const };
const sam = { id: "sam", role: "developer" as const };
const product = { id: "pm", role: "product" as const };
const alexResponse = { profileId: "alex", status: "in-progress" as const };
const submitted = { ...alexResponse, status: "submitted" as const };

describe("reading responses", () => {
  it("lets a developer read only their own response", () => {
    expect(canReadResponse(alex, alexResponse)).toBe(true);
    expect(canReadResponse(sam, alexResponse)).toBe(false);
  });

  it("lets product read every response", () => {
    expect(canReadResponse(product, alexResponse)).toBe(true);
    expect(manageResponsesRefusal(product)).toBeNull();
    expect(manageResponsesRefusal(alex)).toEqual({ status: 403, error: PRODUCT_ONLY });
  });

  it("gives only developers an own response", () => {
    expect(ownResponseRefusal(alex)).toBeNull();
    expect(ownResponseRefusal(product)).toEqual({ status: 403, error: OWN_RESPONSE_DEVELOPERS_ONLY });
  });
});

describe("editing answers", () => {
  it("allows only the owner, while in progress and while the game is in discovery", () => {
    expect(editResponseRefusal(alex, alexResponse, "discovery")).toBeNull();
    expect(editResponseRefusal(sam, alexResponse, "discovery")).toEqual({ status: 403, error: NOT_YOUR_RESPONSE });
    expect(editResponseRefusal(alex, submitted, "discovery")).toEqual({ status: 403, error: RESPONSE_SUBMITTED });
    STATUSES.filter((s) => s.value !== "discovery").forEach(({ value }) => {
      expect(editResponseRefusal(alex, alexResponse, value)).toEqual({ status: 403, error: DISCOVERY_CLOSED });
    });
  });

  it("never lets product edit a developer's answers", () => {
    expect(editResponseRefusal(product, alexResponse, "discovery")?.status).toBe(403);
  });
});

describe("reopening and removing", () => {
  it("are product-only; reopening needs a submitted response while the game is in discovery", () => {
    expect(reopenResponseRefusal(alex, submitted, "discovery")).toEqual({ status: 403, error: PRODUCT_ONLY });
    expect(reopenResponseRefusal(product, submitted, "discovery")).toBeNull();
    expect(reopenResponseRefusal(product, alexResponse, "discovery")?.status).toBe(400);
    expect(reopenResponseRefusal(product, submitted, "findings")?.status).toBe(400);
  });
});

describe("summary figure", () => {
  it("counts submitted developers for product and shows a developer their own status", () => {
    const response = (status: "in-progress" | "submitted") => ({ id: status, profileId: status, developerName: status, status, submittedAt: null, answers: {}, version: 1 });

    expect(discoveryKpi("product", null, [response("submitted"), response("in-progress")]).value).toBe("1 of 2");
    expect(discoveryKpi("developer", response("submitted"), []).value).toBe("Submitted");
  });
});
