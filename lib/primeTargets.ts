import { CodebaseDecision, PrimeTargets, TargetState, TargetValue } from "./types";

export type TextTargetKey = "firstRelease" | "unityVersion" | "androidApi" | "resolution" | "layout" | "fpsTarget" | "sdk";

export type TextTargetField = {
  key: TextTargetKey;
  label: string;
  placeholder?: string;
  /** Offers "To be agreed with developer". */
  agreeable?: boolean;
};

/** In display order: first-release scope, then the technical targets. */
export const FIRST_RELEASE_FIELD: TextTargetField = { key: "firstRelease", label: "Other first-release requirements" };

export const TECHNICAL_TARGET_FIELDS: TextTargetField[] = [
  { key: "unityVersion", label: "Target Unity version", placeholder: "Unity 2022.3 LTS", agreeable: true },
  { key: "androidApi", label: "Android API level", placeholder: "API 33", agreeable: true },
  { key: "resolution", label: "Screen resolution", placeholder: "1920×1080" },
  { key: "layout", label: "P1/P2 layout", placeholder: "Two vertical playfields, P2 rotated 180°, shared centre strip" },
  { key: "fpsTarget", label: "FPS target", placeholder: "60" },
  { key: "sdk", label: "Gamesroomz SDK summary or link", placeholder: "Link or short summary" },
];

export const TEXT_TARGET_FIELDS: TextTargetField[] = [FIRST_RELEASE_FIELD, ...TECHNICAL_TARGET_FIELDS];

const AGREEABLE_KEYS = new Set(TEXT_TARGET_FIELDS.filter((f) => f.agreeable).map((f) => f.key));

export const isAgreeable = (key: string) => AGREEABLE_KEYS.has(key as TextTargetKey);

export const TARGET_STATE_OPTIONS: { value: Exclude<TargetState, "">; label: string; agreeableOnly?: boolean }[] = [
  { value: "set", label: "Set" },
  { value: "not-decided", label: "Not decided yet" },
  { value: "agree-with-developer", label: "To be agreed with developer", agreeableOnly: true },
];

export const targetStateOptions = (field: TextTargetField) => TARGET_STATE_OPTIONS.filter((o) => !o.agreeableOnly || field.agreeable);

export const emptyTarget = (): TargetValue => ({ state: "", value: "" });

export const emptyPrimeTargets = (): PrimeTargets => ({
  codebase: "",
  modes: [],
  modesOther: "",
  firstRelease: emptyTarget(),
  unityVersion: emptyTarget(),
  androidApi: emptyTarget(),
  resolution: emptyTarget(),
  layout: { ...emptyTarget(), link: "" },
  fpsTarget: emptyTarget(),
  sdk: emptyTarget(),
});

export const CODEBASE_QUESTION = "Must the existing mobile game continue on the same maintained codebase?";

export const CODEBASE_OPTIONS: { value: Exclude<CodebaseDecision, "">; label: string }[] = [
  { value: "shared", label: "Yes, one shared codebase" },
  { value: "separate", label: "No, Prime may use a separate codebase" },
  { value: "undecided", label: "Not decided yet" },
];

export const MODES_QUESTION = "Which multiplayer modes must the first Prime release include?";
export const OTHER_MODE = "other";

export const MODE_OPTIONS = [
  { value: "same-device", label: "2 players on one Prime device" },
  { value: "online-prime", label: "Online vs another Prime table" },
  { value: "online-mobile", label: "Online vs mobile players" },
  { value: "single-ai", label: "Single player / vs AI" },
  { value: OTHER_MODE, label: "Other" },
];

export function isLink(value: string) {
  return /^https?:\/\/\S+$/i.test(value.trim());
}

/**
 * What a reader sees for a text target: the value when set, a plain label when undecided
 * or left for the developer, and null when nothing has been recorded.
 */
export function describeTarget(target: TargetValue): string | null {
  if (target.state === "set") return target.value.trim() || null;
  if (target.state === "not-decided") return "Not decided yet";
  if (target.state === "agree-with-developer") return "To be agreed with developer";
  return null;
}

/** Human-readable modes, including the "Other" text. */
export function describeModes(targets: PrimeTargets): string[] {
  return targets.modes.map((m) => {
    if (m === OTHER_MODE) return targets.modesOther.trim() ? `Other: ${targets.modesOther.trim()}` : "Other";
    return MODE_OPTIONS.find((o) => o.value === m)?.label ?? m;
  });
}

export function describeCodebase(value: CodebaseDecision) {
  return CODEBASE_OPTIONS.find((o) => o.value === value)?.label ?? "";
}
