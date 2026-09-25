import { CodebaseDecision, PrimeTargets } from "./types";

export const emptyPrimeTargets = (): PrimeTargets => ({
  unityVersion: "",
  androidApi: "",
  resolution: "",
  layout: "",
  layoutSketch: "",
  fpsTarget: "",
  sdk: "",
  firstRelease: "",
  codebase: "",
  modes: [],
  modesOther: "",
});

type TextKey = "unityVersion" | "androidApi" | "resolution" | "layout" | "fpsTarget" | "sdk" | "firstRelease";

export const PRIME_TARGET_FIELDS: { key: TextKey; label: string }[] = [
  { key: "unityVersion", label: "Target Unity version" },
  { key: "androidApi", label: "Android API level" },
  { key: "resolution", label: "Screen resolution" },
  { key: "layout", label: "P1/P2 layout" },
  { key: "fpsTarget", label: "FPS target" },
  { key: "sdk", label: "Gamesroomz SDK summary or link" },
  { key: "firstRelease", label: "First release must include" },
];

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
