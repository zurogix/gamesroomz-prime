import { CODEBASE_OPTIONS, emptyPrimeTargets, isAgreeable, TEXT_TARGET_FIELDS, TextTargetKey } from "./primeTargets";
import { CodebaseDecision, PrimeTargets, TargetState, TargetValue } from "./types";

const STATES: TargetState[] = ["set", "not-decided", "agree-with-developer", ""];

const asString = (value: unknown) => (typeof value === "string" ? value : "");

function hydrateState(key: TextTargetKey, value: unknown): TargetState {
  const state = STATES.find((s) => s === value) ?? "";
  if (state === "agree-with-developer" && !isAgreeable(key)) return "";
  return state;
}

/** Old drafts saved a plain string: non-empty means it was set. */
function hydrateTarget(key: TextTargetKey, saved: unknown): TargetValue {
  if (typeof saved === "string") return saved.trim() ? { state: "set", value: saved } : { state: "", value: "" };
  if (!saved || typeof saved !== "object") return { state: "", value: "" };
  const target = saved as Record<string, unknown>;
  return { state: hydrateState(key, target.state), value: asString(target.value) };
}

/** The layout sketch link used to be its own field (layoutSketch). */
function hydrateLayout(saved: Record<string, unknown>): TargetValue {
  const layout = hydrateTarget("layout", saved.layout);
  const current = saved.layout && typeof saved.layout === "object" ? asString((saved.layout as Record<string, unknown>).link) : "";
  return { ...layout, link: current || asString(saved.layoutSketch) };
}

function hydrateCodebase(value: unknown): CodebaseDecision {
  return CODEBASE_OPTIONS.find((o) => o.value === value)?.value ?? "";
}

/** Converts any saved targets (current or older shape) into the current shape. */
export function hydratePrimeTargets(saved: Record<string, unknown> | undefined): PrimeTargets {
  const base = emptyPrimeTargets();
  if (!saved) return base;
  const text = Object.fromEntries(TEXT_TARGET_FIELDS.map((f) => [f.key, hydrateTarget(f.key, saved[f.key])])) as Record<TextTargetKey, TargetValue>;
  return {
    ...base,
    ...text,
    layout: hydrateLayout(saved),
    codebase: hydrateCodebase(saved.codebase),
    modes: Array.isArray(saved.modes) ? saved.modes.filter((m): m is string => typeof m === "string") : [],
    modesOther: asString(saved.modesOther),
  };
}
