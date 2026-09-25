import { Workstream } from "./types";

type LegacyField = "currentImplementation" | "reusedComponents" | "changedComponents" | "primeRequirement";

/**
 * Text earlier versions of the plan template pre-filled. Used only to recognise
 * untouched defaults in saved drafts; any text a person edited never matches.
 */
export const LEGACY_TEMPLATE_DEFAULTS: Record<string, Partial<Record<LegacyField, string[]>>> = {
  "technical-investigation": {
    currentImplementation: [
      "Legacy Unity mobile project with complete source code.",
    ],
    reusedComponents: [
      "Existing source repository, game assets and documentation.",
    ],
    changedComponents: [
      "Audit only; no production behaviour should change in this workstream.",
    ],
  },
  "unity-modernization": {
    currentImplementation: [
      "Existing game uses a legacy Unity version.",
    ],
    reusedComponents: [
      "Scenes, prefabs, C# game logic and assets where compatible.",
    ],
    changedComponents: [
      "Deprecated Unity APIs, packages, plugins and project settings as required.",
    ],
  },
  "android-modernization": {
    currentImplementation: [
      "Mobile game uses an older Android SDK/toolchain.",
    ],
    reusedComponents: [
      "Existing Android-compatible game code where possible.",
    ],
    changedComponents: [
      "SDK/API level, Gradle, JDK, manifests and native plugins as required.",
    ],
  },
  "core-gameplay": {
    currentImplementation: [
      "Existing Bubble Shooter PvP mechanics, scoring, attacks, levels and content.",
    ],
    reusedComponents: [
      "Bubble mechanics, aiming, collision/matching, score rules, attack rules, assets, animation and audio where compatible.",
    ],
    changedComponents: [
      "Only items specifically identified by the assessment.",
    ],
  },
  "multiplayer-engine-2": {
    currentImplementation: [
      "Existing mobile PvP engine is designed around mobile devices and must be assessed for networking, player-model, input and state-management coupling.",
      "Existing mobile PvP engine is designed around mobile devices; its networking, player model, input and state management are described in the discovery answers.",
    ],
    reusedComponents: [
      "Document reusable match rules, game state, board logic, scoring, attacks, results and networking abstractions.",
    ],
    changedComponents: [
      "Document LocalPlayer/RemotePlayer assumptions, networking-framework coupling, player ownership, transport, input sources and any mobile-specific state-update logic that must change.",
    ],
    primeRequirement: [
      "Prefer one player-agnostic multiplayer core supporting both existing mobile PvP and Prime shared-device multiplayer, unless technical evidence shows that a separate Prime engine is the more appropriate path.",
    ],
  },
  "player-controller": {
    currentImplementation: [
      "Current controller is designed around the mobile local-player model.",
    ],
    reusedComponents: [
      "Existing shooter-control logic where it can be parameterised by player.",
    ],
    changedComponents: [
      "Player ownership, state, score and per-player references.",
      "Player ownership, state, score and per-player references.\nExcludes core engine refactoring already estimated in Multiplayer Engine 2.0.",
    ],
  },
  "multi-touch": {
    currentImplementation: [
      "Mobile input is primarily designed for one active local player.",
    ],
    reusedComponents: [
      "Existing touch gestures and aiming behaviour where appropriate.",
    ],
    changedComponents: [
      "Input routing, touch ownership, player zones and simultaneous gesture handling.",
      "Input routing, touch ownership, player zones and simultaneous gesture handling.\nExcludes core engine refactoring already estimated in Multiplayer Engine 2.0.",
    ],
  },
  "prime-ui": {
    currentImplementation: [
      "Mobile portrait UI designed for one player viewing one device.",
    ],
    reusedComponents: [
      "Existing gameplay visuals and UI assets where resolution/layout permits.",
    ],
    changedComponents: [
      "Canvas layout, camera framing, menus, results, player labels and shared battle/status area.",
    ],
    primeRequirement: [
      "16:9 tabletop layout with two vertical P1/P2 playfields; opposite player UI may require 180° orientation.",
      "Tabletop layout as defined in Prime targets; opposite player UI may require 180° orientation.",
    ],
  },
  "networking": {
    currentImplementation: [
      "Existing online PvP synchronizes players across separate mobile devices.",
    ],
    reusedComponents: [
      "Online PvP components needed for future table-vs-table play may be retained separately.",
    ],
    changedComponents: [
      "Remove unnecessary same-table move synchronization and decouple local match logic from remote-player assumptions.",
      "Remove unnecessary same-table move synchronization and decouple local match logic from remote-player assumptions.\nExcludes core engine refactoring already estimated in Multiplayer Engine 2.0.",
    ],
  },
  "gamesroomz-integration": {
    currentImplementation: [
      "Game currently uses its own mobile account/session integrations.",
    ],
    reusedComponents: [
      "Game-facing abstractions where they can be adapted.",
    ],
    changedComponents: [
      "Legacy login/session hooks replaced by Gamesroomz SDK contract.",
    ],
  },
  "score-results": {
    currentImplementation: [
      "Existing game already supports score upload.",
    ],
    reusedComponents: [
      "Existing score calculation and result-generation logic.",
    ],
    changedComponents: [
      "Transport/API layer and player identity mapping.",
    ],
  },
  "launcher-lifecycle": {
    currentImplementation: [
      "Mobile app owns its own start/exit lifecycle.",
    ],
    reusedComponents: [
      "Existing game start/end events where available.",
    ],
    changedComponents: [
      "Launch parameters, ready/start/end events, cleanup and return-to-launcher handling.",
    ],
  },
  "qa": {
    currentImplementation: [
      "Existing QA is focused on mobile Android/iOS devices.",
    ],
    reusedComponents: [
      "Existing functional test cases where still relevant.",
    ],
    changedComponents: [
      "New Prime-specific hardware and multi-player test coverage.",
    ],
  },
};

/** Replaces saved values that exactly equal an old default with the current template value. */
export function replaceLegacyDefaults(saved: Workstream, template: Workstream): Workstream {
  const legacy = LEGACY_TEMPLATE_DEFAULTS[template.id];
  if (!legacy) return saved;
  return (Object.keys(legacy) as LegacyField[]).reduce<Workstream>((w, field) => {
    const isOldDefault = legacy[field]?.includes(w[field]);
    return isOldDefault ? { ...w, [field]: template[field] } : w;
  }, saved);
}
