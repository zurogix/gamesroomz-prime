import { Question, Workstream } from "./types";

export const questions: Question[] = [
  { id:"health-open", section:"Project Health", prompt:"Can the existing Unity project be opened successfully today?", weight:1, workstream:"technical-investigation" },
  { id:"health-build", section:"Project Health", prompt:"Can the current Android version be built successfully?", weight:2, workstream:"android-modernization" },
  { id:"health-assets", section:"Project Health", prompt:"Are all required source assets, plugins and libraries available?", weight:1, workstream:"technical-investigation" },
  { id:"health-obsolete", section:"Project Health", prompt:"Are there obsolete or unsupported Unity plugins in the project?", helper:"If yes, identify which plugins and whether they can be removed or must be replaced.", weight:2, workstream:"unity-modernization" },

  { id:"unity-upgrade", section:"Unity & Android", prompt:"Can the project be upgraded to the agreed Prime Unity version without a major gameplay rewrite?", weight:3, workstream:"unity-modernization" },
  { id:"android-upgrade", section:"Unity & Android", prompt:"Can the Android SDK / Gradle / JDK toolchain be upgraded without replacing major native integrations?", weight:3, workstream:"android-modernization" },
  { id:"native-plugins", section:"Unity & Android", prompt:"Does the current game use native Android/iOS plugins that affect gameplay or networking?", weight:2, workstream:"android-modernization" },
  { id:"mobile-services", section:"Unity & Android", prompt:"Can mobile-only services such as ads, mobile IAP or social login be removed for Prime?", weight:1, workstream:"unity-modernization" },

  { id:"gameplay-core", section:"Core Gameplay", prompt:"Can the existing bubble shooting mechanics be reused substantially unchanged?", weight:3, workstream:"core-gameplay" },
  { id:"gameplay-aim", section:"Core Gameplay", prompt:"Can the existing aiming, shooting, collision and bubble-matching logic be reused?", weight:2, workstream:"core-gameplay" },
  { id:"gameplay-score", section:"Core Gameplay", prompt:"Can the existing scoring, win/loss and attack rules be reused?", weight:2, workstream:"core-gameplay" },
  { id:"gameplay-assets", section:"Core Gameplay", prompt:"Can the existing artwork, animations, audio, effects and level content be reused at Prime resolution?", weight:1, workstream:"core-gameplay" },

  { id:"pvp-device", section:"PvP Architecture", prompt:"Does the current PvP architecture assume one local player per physical device?", helper:"The current mobile model is expected to be one local player plus a remote opponent.", weight:4, workstream:"multiplayer-architecture" },
  { id:"pvp-two-local", section:"PvP Architecture", prompt:"Can two local players currently exist inside one Unity game instance?", weight:5, workstream:"multiplayer-architecture" },
  { id:"pvp-state", section:"PvP Architecture", prompt:"Can the existing shared game-state / battle rules support both Prime players locally?", weight:4, workstream:"multiplayer-architecture" },
  { id:"pvp-controller", section:"PvP Architecture", prompt:"Can the current player-controller architecture support P1 and P2 without a major rewrite?", weight:5, workstream:"player-controller" },
  { id:"pvp-server", section:"PvP Architecture", prompt:"Can same-table Prime gameplay run locally without sending every move through the existing PvP server?", weight:3, workstream:"networking" },

  { id:"touch-multi", section:"Multi-Touch & Input", prompt:"Does the existing game already support simultaneous multi-touch input?", weight:4, workstream:"multi-touch" },
  { id:"touch-route", section:"Multi-Touch & Input", prompt:"Can touches be reliably assigned to P1 and P2 gameplay zones?", weight:5, workstream:"multi-touch" },
  { id:"touch-simultaneous", section:"Multi-Touch & Input", prompt:"Can both players aim and shoot at exactly the same time?", weight:4, workstream:"multi-touch" },
  { id:"touch-large", section:"Multi-Touch & Input", prompt:"Are existing controls suitable for a large tabletop touchscreen without redesign?", weight:2, workstream:"multi-touch" },

  { id:"ui-two-fields", section:"Prime 16:9 UI", prompt:"Can two vertical bubble-shooter playfields fit cleanly inside the Prime 16:9 tabletop layout?", weight:3, workstream:"prime-ui" },
  { id:"ui-camera", section:"Prime 16:9 UI", prompt:"Can the existing gameplay camera / playfield framing be reused with limited adjustment?", weight:3, workstream:"prime-ui" },
  { id:"ui-rotate", section:"Prime 16:9 UI", prompt:"Can P2 gameplay and UI be rotated 180° without changing core gameplay logic?", weight:2, workstream:"prime-ui" },
  { id:"ui-assets", section:"Prime 16:9 UI", prompt:"Are current UI and visual assets suitable for the larger Prime display resolution?", weight:2, workstream:"prime-ui" },

  { id:"gr-account", section:"Gamesroomz Integration", prompt:"Can the existing game login/account layer be replaced by Gamesroomz player identity?", weight:2, workstream:"gamesroomz-integration" },
  { id:"gr-session", section:"Gamesroomz Integration", prompt:"Can the game receive session ID, P1/P2 identities and seat mapping from the Gamesroomz SDK?", weight:3, workstream:"gamesroomz-integration" },
  { id:"gr-score", section:"Gamesroomz Integration", prompt:"Can the existing score/result upload be replaced by Gamesroomz result submission?", weight:2, workstream:"score-results" },
  { id:"gr-lifecycle", section:"Gamesroomz Integration", prompt:"Can the game support standard Prime lifecycle events: launch, ready, start, end and return to launcher?", weight:3, workstream:"launcher-lifecycle" },

  { id:"qa-install", section:"Prime Hardware & QA", prompt:"Has an Android build of the existing game already been installed and run on Prime-class hardware?", weight:2, workstream:"qa" },
  { id:"qa-performance", section:"Prime Hardware & QA", prompt:"Is current performance expected to meet stable FPS and memory requirements on Prime hardware?", weight:2, workstream:"qa" },
  { id:"qa-session", section:"Prime Hardware & QA", prompt:"Can one player session end cleanly before the next users begin?", weight:2, workstream:"qa" },
  { id:"qa-network", section:"Prime Hardware & QA", prompt:"Does the current game handle network interruption without corrupting a match or result?", weight:2, workstream:"qa" },
];

export const planTemplate: Workstream[] = [
  {
    id:"technical-investigation", title:"Technical Investigation",
    currentImplementation:"Legacy Unity mobile project with complete source code.",
    primeRequirement:"Establish a verified baseline of project health, dependencies and build status before conversion.",
    classification:"modify", whyChange:"", proposedImplementation:"",
    reusedComponents:"Existing source repository, game assets and documentation.",
    changedComponents:"Audit only; no production behaviour should change in this workstream.",
    deliverable:"Technical baseline report and verified build/open status.",
    personDays:0, dependencies:"Access to full source, historical SDKs/plugins and developer environment.", risk:"medium", scopeType:"mandatory"
  },
  {
    id:"unity-modernization", title:"Unity Modernization",
    currentImplementation:"Existing game uses a legacy Unity version.",
    primeRequirement:"Run on one agreed, supported Unity version for Prime and future Gamesroomz SDK maintenance.",
    classification:"modify", whyChange:"", proposedImplementation:"",
    reusedComponents:"Scenes, prefabs, C# game logic and assets where compatible.",
    changedComponents:"Deprecated Unity APIs, packages, plugins and project settings as required.",
    deliverable:"Project opens, compiles and runs cleanly on the agreed Prime Unity version.",
    personDays:0, dependencies:"Target Unity version must be agreed.", risk:"medium", scopeType:"mandatory"
  },
  {
    id:"android-modernization", title:"Android Toolchain Modernization",
    currentImplementation:"Mobile game uses an older Android SDK/toolchain.",
    primeRequirement:"Produce a stable Android build compatible with the Prime OS and hardware baseline.",
    classification:"modify", whyChange:"", proposedImplementation:"",
    reusedComponents:"Existing Android-compatible game code where possible.",
    changedComponents:"SDK/API level, Gradle, JDK, manifests and native plugins as required.",
    deliverable:"Installable Prime-compatible Android build.",
    personDays:0, dependencies:"Prime Android OS/API baseline and hardware access.", risk:"medium", scopeType:"mandatory"
  },
  {
    id:"core-gameplay", title:"Core Gameplay",
    currentImplementation:"Existing Bubble Shooter PvP mechanics, scoring, attacks, levels and content.",
    primeRequirement:"Retain proven gameplay unless a Prime constraint makes a change necessary.",
    classification:"reuse", whyChange:"", proposedImplementation:"",
    reusedComponents:"Bubble mechanics, aiming, collision/matching, score rules, attack rules, assets, animation and audio where compatible.",
    changedComponents:"Only items specifically identified by the assessment.",
    deliverable:"Prime build preserves the intended Bubble Shooter gameplay.",
    personDays:0, dependencies:"Multiplayer architecture decisions.", risk:"low", scopeType:"mandatory"
  },
  {
    id:"multiplayer-architecture", title:"Shared-Device Multiplayer Architecture",
    currentImplementation:"Online mobile PvP: typically one local player per device and one remote opponent.",
    primeRequirement:"Two players play simultaneously inside one Unity instance on one Prime tabletop device.",
    classification:"rewrite", whyChange:"", proposedImplementation:"",
    reusedComponents:"Existing battle rules and game-state logic where separable from networking.",
    changedComponents:"Local/remote assumptions, player ownership, game-state orchestration and match lifecycle.",
    deliverable:"P1 and P2 can participate in the same local match instance.",
    personDays:0, dependencies:"Player controller, multi-touch and networking decisions.", risk:"high", scopeType:"mandatory"
  },
  {
    id:"player-controller", title:"Player Controller",
    currentImplementation:"Current controller is designed around the mobile local-player model.",
    primeRequirement:"Independent P1 and P2 controllers inside the same game instance.",
    classification:"modify", whyChange:"", proposedImplementation:"",
    reusedComponents:"Existing shooter-control logic where it can be parameterised by player.",
    changedComponents:"Player ownership, state, score and per-player references.",
    deliverable:"Two independent player controllers with no cross-control leakage.",
    personDays:0, dependencies:"Shared-device multiplayer architecture.", risk:"high", scopeType:"mandatory"
  },
  {
    id:"multi-touch", title:"Multi-Touch Input",
    currentImplementation:"Mobile input is primarily designed for one active local player.",
    primeRequirement:"P1 and P2 must aim/shoot simultaneously on separate tabletop regions.",
    classification:"new", whyChange:"", proposedImplementation:"",
    reusedComponents:"Existing touch gestures and aiming behaviour where appropriate.",
    changedComponents:"Input routing, touch ownership, player zones and simultaneous gesture handling.",
    deliverable:"Reliable simultaneous multi-touch with independent P1/P2 input.",
    personDays:0, dependencies:"Final Prime screen layout and hardware touch behaviour.", risk:"high", scopeType:"mandatory"
  },
  {
    id:"prime-ui", title:"Prime 16:9 Tabletop UI",
    currentImplementation:"Mobile portrait UI designed for one player viewing one device.",
    primeRequirement:"16:9 tabletop layout with two vertical P1/P2 playfields; opposite player UI may require 180° orientation.",
    classification:"modify", whyChange:"", proposedImplementation:"",
    reusedComponents:"Existing gameplay visuals and UI assets where resolution/layout permits.",
    changedComponents:"Canvas layout, camera framing, menus, results, player labels and shared battle/status area.",
    deliverable:"Readable and usable two-player Prime tabletop interface.",
    personDays:0, dependencies:"Approved Prime UX/layout.", risk:"medium", scopeType:"mandatory"
  },
  {
    id:"networking", title:"Networking",
    currentImplementation:"Existing online PvP synchronizes players across separate mobile devices.",
    primeRequirement:"Same-table gameplay should run locally where practical; backend remains responsible for platform/session/result needs.",
    classification:"modify", whyChange:"", proposedImplementation:"",
    reusedComponents:"Online PvP components needed for future table-vs-table play may be retained separately.",
    changedComponents:"Remove unnecessary same-table move synchronization and decouple local match logic from remote-player assumptions.",
    deliverable:"Stable local Prime match with only required backend communications.",
    personDays:0, dependencies:"Gamesroomz platform contract and future online PvP scope.", risk:"medium", scopeType:"mandatory"
  },
  {
    id:"gamesroomz-integration", title:"Gamesroomz SDK Integration",
    currentImplementation:"Game currently uses its own mobile account/session integrations.",
    primeRequirement:"Gamesroomz provides authenticated player identity, session and player-seat information.",
    classification:"new", whyChange:"", proposedImplementation:"",
    reusedComponents:"Game-facing abstractions where they can be adapted.",
    changedComponents:"Legacy login/session hooks replaced by Gamesroomz SDK contract.",
    deliverable:"Game initializes from Gamesroomz and receives P1/P2 session data.",
    personDays:0, dependencies:"Gamesroomz Unity SDK/API specification.", risk:"medium", scopeType:"mandatory"
  },
  {
    id:"score-results", title:"Score & Result Integration",
    currentImplementation:"Existing game already supports score upload.",
    primeRequirement:"Submit P1/P2 result, winner and agreed game metrics through Gamesroomz.",
    classification:"modify", whyChange:"", proposedImplementation:"",
    reusedComponents:"Existing score calculation and result-generation logic.",
    changedComponents:"Transport/API layer and player identity mapping.",
    deliverable:"Verified result reaches Gamesroomz for both players.",
    personDays:0, dependencies:"Gamesroomz result schema.", risk:"low", scopeType:"mandatory"
  },
  {
    id:"launcher-lifecycle", title:"Prime Launcher Lifecycle",
    currentImplementation:"Mobile app owns its own start/exit lifecycle.",
    primeRequirement:"Prime launcher starts the game with a session and receives clean termination/return control.",
    classification:"new", whyChange:"", proposedImplementation:"",
    reusedComponents:"Existing game start/end events where available.",
    changedComponents:"Launch parameters, ready/start/end events, cleanup and return-to-launcher handling.",
    deliverable:"Repeatable launch → play → result → exit → next-session flow.",
    personDays:0, dependencies:"Prime launcher contract.", risk:"medium", scopeType:"mandatory"
  },
  {
    id:"qa", title:"Prime Hardware QA & Stabilization",
    currentImplementation:"Existing QA is focused on mobile Android/iOS devices.",
    primeRequirement:"Validate large-screen rendering, multi-touch, performance, session cleanup and reliability on Prime hardware.",
    classification:"new", whyChange:"", proposedImplementation:"",
    reusedComponents:"Existing functional test cases where still relevant.",
    changedComponents:"New Prime-specific hardware and multi-player test coverage.",
    deliverable:"Prime conversion QA checklist completed with blocking defects resolved.",
    personDays:0, dependencies:"Access to representative Prime hardware.", risk:"medium", scopeType:"mandatory"
  }
];
