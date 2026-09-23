import { Question, Workstream } from "./types";

export const questions: Question[] = [
  {
    "id": "v2-baseline",
    "section": "Project Health",
    "prompt": "What work is needed to open the source project and produce a baseline build?",
    "helper": "Record the tested commit, Unity version and build result. List missing assets, plugins or access; a failed build alone is not evidence that gameplay needs rewriting.",
    "workstream": "technical-investigation"
  },
  {
    "id": "v2-dependencies",
    "section": "Project Health",
    "prompt": "What must change in existing packages or plugins?",
    "helper": "Identify unsupported dependencies, where they are used and whether to keep, remove or replace them. Separate investigation from implementation effort.",
    "workstream": "unity-modernization"
  },
  {
    "id": "v2-unity",
    "section": "Unity & Android",
    "prompt": "What Unity changes are required by the agreed Prime baseline?",
    "helper": "Compare the current editor and packages with the confirmed target version. Reuse if compatible; do not assume an upgrade or gameplay rewrite is required. Await the specification if unknown.",
    "workstream": "unity-modernization"
  },
  {
    "id": "v2-android",
    "section": "Unity & Android",
    "prompt": "What Android build changes are required for the actual Prime device?",
    "helper": "Check OS/API, CPU architecture, graphics support, SDK/Gradle/JDK and native plugins. Record an install/build test; use Prime requirements rather than assuming mobile-store requirements apply.",
    "workstream": "android-modernization"
  },
  {
    "id": "v2-services",
    "section": "Unity & Android",
    "prompt": "What must happen to mobile ads, purchases, login and other mobile services?",
    "helper": "List what Prime keeps, replaces or removes, plus dependencies on rewards, boosters or progression. Not applicable if no such services exist.",
    "workstream": "gamesroomz-integration"
  },
  {
    "id": "v2-mechanics",
    "section": "Core Gameplay",
    "prompt": "What changes are needed to reuse bubble-shooting mechanics?",
    "helper": "Check aiming, firing, wall bounces, collision, matching, falling bubbles and board-clear behaviour. Identify the affected component rather than estimating each mechanic separately.",
    "workstream": "core-gameplay"
  },
  {
    "id": "v2-battle",
    "section": "Core Gameplay",
    "prompt": "What changes are needed to preserve the intended PvP rules?",
    "helper": "Check scoring, next-bubble generation, opponent bubbles, timers and simultaneous win/loss. Specify tie-breaking, pending opponent bubbles and fairness rules; do not add optional redesign here.",
    "workstream": "core-gameplay"
  },
  {
    "id": "v2-assets",
    "section": "Core Gameplay",
    "prompt": "What gameplay content needs adapting for Prime?",
    "helper": "Check artwork, animation, effects, audio and levels at the agreed resolution and viewing distance. Count UI layout effort in the UI workstream, not here.",
    "workstream": "core-gameplay"
  },
  {
    "id": "v2-state",
    "section": "PvP Architecture",
    "prompt": "What changes allow two independent boards in one game instance?",
    "helper": "Check separate grids, bubble queues, scores, timers, effects, object pools, collisions and global/static references. An existing local/remote design may be adaptable.",
    "workstream": "multiplayer-architecture"
  },
  {
    "id": "v2-controllers",
    "section": "PvP Architecture",
    "prompt": "What changes allow two independent local player controllers?",
    "helper": "Check ownership and references so aiming or firing for P1 never controls P2. Keep touch routing effort in Multi-Touch Input.",
    "workstream": "player-controller"
  },
  {
    "id": "v2-opponent",
    "section": "PvP Architecture",
    "prompt": "What changes deliver opponent bubbles correctly between local players?",
    "helper": "Verify source and recipient, timing, ordering and exactly one delivery, including simultaneous sends and match end. Reuse the existing battle rules where possible.",
    "workstream": "multiplayer-architecture"
  },
  {
    "id": "v2-server",
    "section": "PvP Architecture",
    "prompt": "What server dependencies must change for same-table play?",
    "helper": "Identify matchmaking, bubble generation, timers, move validation and winner determination. Specify what runs locally and what remains online. Future table-vs-table play is optional unless agreed.",
    "workstream": "networking"
  },
  {
    "id": "v2-ownership",
    "section": "Multi-Touch & Input",
    "prompt": "What changes keep each aiming gesture owned by the correct player?",
    "helper": "Track each touch from press through movement to release/cancellation, including crossing the centre boundary and extra fingers. Do not reassign an active gesture just because its position changes.",
    "workstream": "multi-touch"
  },
  {
    "id": "v2-concurrent",
    "section": "Multi-Touch & Input",
    "prompt": "What changes allow both players to aim and shoot simultaneously?",
    "helper": "Test on the actual touch panel: concurrent drags/releases, responsiveness, touch limits, edge touches and cancelled input. Mouse-only testing is insufficient.",
    "workstream": "multi-touch"
  },
  {
    "id": "v2-menus",
    "section": "Multi-Touch & Input",
    "prompt": "What changes prevent controls, menus and accidental touches interfering?",
    "helper": "Check gameplay plus UI touches, reach, hand occlusion, extra fingers and the agreed pause/exit policy. Specify how one player’s menu affects the shared match.",
    "workstream": "multi-touch"
  },
  {
    "id": "v2-layout",
    "section": "Prime 16:9 UI",
    "prompt": "What layout changes make both playfields readable and reachable?",
    "helper": "Confirm seating positions and playable dimensions. Preserve intended grid size and shooting angles; check control size and shared status areas on the tabletop.",
    "workstream": "prime-ui"
  },
  {
    "id": "v2-orientation",
    "section": "Prime 16:9 UI",
    "prompt": "What camera and input-coordinate changes are needed for the chosen orientation?",
    "helper": "If players sit opposite each other, test P2 at 180 degrees with correct aiming and touch-to-board mapping. Do not assume opposite seating before layout approval.",
    "workstream": "prime-ui"
  },
  {
    "id": "v2-flow",
    "section": "Prime 16:9 UI",
    "prompt": "What UI changes support both players from ready-up through results?",
    "helper": "Check player/seat labels, shared start, readable instructions, simultaneous readiness, correctly oriented results, rematch and return to launcher.",
    "workstream": "prime-ui"
  },
  {
    "id": "v2-identity",
    "section": "Gamesroomz Integration",
    "prompt": "What changes receive and use Gamesroomz player and session details?",
    "helper": "Use the confirmed SDK/API contract for session ID, P1/P2 identity, seats and guest rules. Await the specification if it is unavailable; do not invent a contract.",
    "workstream": "gamesroomz-integration"
  },
  {
    "id": "v2-results",
    "section": "Gamesroomz Integration",
    "prompt": "What changes submit the correct result for both players?",
    "helper": "Confirm the result schema, winner/tie/aborted-match rules and identity mapping. Include retries without duplicate results and the agreed offline-result policy.",
    "workstream": "score-results"
  },
  {
    "id": "v2-launcher",
    "section": "Gamesroomz Integration",
    "prompt": "What changes support launch, ready, start, end and return to launcher?",
    "helper": "Use the agreed launcher contract. Handle interrupted or repeated launches, cancelled sessions and cleanup before the next users.",
    "workstream": "launcher-lifecycle"
  },
  {
    "id": "v2-performance",
    "section": "Prime Hardware & QA",
    "prompt": "What testing or fixes are needed to meet measured Prime performance targets?",
    "helper": "Record actual device, resolution, FPS/frame-time and memory results with both boards and peak effects active. Include extended use. Unknown measurements require investigation, not an optimistic pass. Count shared QA here and code fixes in their owning workstream.",
    "workstream": "qa"
  },
  {
    "id": "v2-recovery",
    "section": "Prime Hardware & QA",
    "prompt": "What testing or fixes are needed for network and app interruptions?",
    "helper": "Test loss of connection during start, play and result upload, plus background/resume or forced exit. Verify the agreed continue/abort policy and no duplicate or misassigned result.",
    "workstream": "qa"
  },
  {
    "id": "v2-repeat",
    "section": "Prime Hardware & QA",
    "prompt": "What testing or fixes are needed for repeated two-player sessions?",
    "helper": "Verify ready → play → result → exit → next users, clean identities and board state, and no stale touch, event or network handlers. Include both orientations and simultaneous match-ending cases.",
    "workstream": "qa"
  }
];

export const planTemplate: Workstream[] = [
  {
    id:"technical-investigation", title:"Technical Investigation",
    currentImplementation:"",
    primeRequirement:"Establish a verified baseline of project health, dependencies and build status before conversion.",
    classification:"", whyChange:"", proposedImplementation:"",
    reusedComponents:"",
    changedComponents:"",
    deliverable:"Technical baseline report and verified build/open status.",
    personDays:null, reviewed:false, dependencies:"", risk:"", scopeType:"mandatory"
  },
  {
    id:"unity-modernization", title:"Unity & Dependency Compatibility",
    currentImplementation:"",
    primeRequirement:"Meet the confirmed Prime Unity and SDK compatibility baseline; upgrade only where required.",
    classification:"", whyChange:"", proposedImplementation:"",
    reusedComponents:"",
    changedComponents:"",
    deliverable:"Project opens, compiles and runs cleanly on the agreed Prime Unity version.",
    personDays:null, reviewed:false, dependencies:"", risk:"", scopeType:"mandatory"
  },
  {
    id:"android-modernization", title:"Android Build Compatibility",
    currentImplementation:"",
    primeRequirement:"Produce a stable Android build compatible with the Prime OS and hardware baseline.",
    classification:"", whyChange:"", proposedImplementation:"",
    reusedComponents:"",
    changedComponents:"",
    deliverable:"Installable Prime-compatible Android build.",
    personDays:null, reviewed:false, dependencies:"", risk:"", scopeType:"mandatory"
  },
  {
    id:"core-gameplay", title:"Core Gameplay",
    currentImplementation:"",
    primeRequirement:"Retain proven gameplay unless a Prime constraint makes a change necessary.",
    classification:"", whyChange:"", proposedImplementation:"",
    reusedComponents:"",
    changedComponents:"",
    deliverable:"Prime build preserves the intended Bubble Shooter gameplay.",
    personDays:null, reviewed:false, dependencies:"", risk:"", scopeType:"mandatory"
  },
  {
    id:"multiplayer-architecture", title:"Shared-Device Multiplayer Architecture",
    currentImplementation:"",
    primeRequirement:"Two players play simultaneously inside one Unity instance on one Prime tabletop device.",
    classification:"", whyChange:"", proposedImplementation:"",
    reusedComponents:"",
    changedComponents:"",
    deliverable:"P1 and P2 can participate in the same local match instance.",
    personDays:null, reviewed:false, dependencies:"", risk:"", scopeType:"mandatory"
  },
  {
    id:"player-controller", title:"Player Controller",
    currentImplementation:"",
    primeRequirement:"Independent P1 and P2 controllers inside the same game instance.",
    classification:"", whyChange:"", proposedImplementation:"",
    reusedComponents:"",
    changedComponents:"",
    deliverable:"Two independent player controllers with no cross-control leakage.",
    personDays:null, reviewed:false, dependencies:"", risk:"", scopeType:"mandatory"
  },
  {
    id:"multi-touch", title:"Multi-Touch Input",
    currentImplementation:"",
    primeRequirement:"P1 and P2 must aim/shoot simultaneously on separate tabletop regions.",
    classification:"", whyChange:"", proposedImplementation:"",
    reusedComponents:"",
    changedComponents:"",
    deliverable:"Reliable simultaneous multi-touch with independent P1/P2 input.",
    personDays:null, reviewed:false, dependencies:"", risk:"", scopeType:"mandatory"
  },
  {
    id:"prime-ui", title:"Prime 16:9 Tabletop UI",
    currentImplementation:"",
    primeRequirement:"16:9 tabletop layout with two vertical P1/P2 playfields; opposite player UI may require 180° orientation.",
    classification:"", whyChange:"", proposedImplementation:"",
    reusedComponents:"",
    changedComponents:"",
    deliverable:"Readable and usable two-player Prime tabletop interface.",
    personDays:null, reviewed:false, dependencies:"", risk:"", scopeType:"mandatory"
  },
  {
    id:"networking", title:"Networking",
    currentImplementation:"",
    primeRequirement:"Same-table gameplay should run locally where practical; backend remains responsible for platform/session/result needs.",
    classification:"", whyChange:"", proposedImplementation:"",
    reusedComponents:"",
    changedComponents:"",
    deliverable:"Stable local Prime match with only required backend communications.",
    personDays:null, reviewed:false, dependencies:"", risk:"", scopeType:"mandatory"
  },
  {
    id:"gamesroomz-integration", title:"Gamesroomz SDK Integration",
    currentImplementation:"",
    primeRequirement:"Use the agreed Gamesroomz identity/session contract and resolve dependencies on mobile-only services.",
    classification:"", whyChange:"", proposedImplementation:"",
    reusedComponents:"",
    changedComponents:"",
    deliverable:"Game initializes from Gamesroomz and receives P1/P2 session data.",
    personDays:null, reviewed:false, dependencies:"", risk:"", scopeType:"mandatory"
  },
  {
    id:"score-results", title:"Score & Result Integration",
    currentImplementation:"",
    primeRequirement:"Submit P1/P2 result, winner and agreed game metrics through Gamesroomz.",
    classification:"", whyChange:"", proposedImplementation:"",
    reusedComponents:"",
    changedComponents:"",
    deliverable:"Verified result reaches Gamesroomz for both players.",
    personDays:null, reviewed:false, dependencies:"", risk:"", scopeType:"mandatory"
  },
  {
    id:"launcher-lifecycle", title:"Prime Launcher Lifecycle",
    currentImplementation:"",
    primeRequirement:"Prime launcher starts the game with a session and receives clean termination/return control.",
    classification:"", whyChange:"", proposedImplementation:"",
    reusedComponents:"",
    changedComponents:"",
    deliverable:"Repeatable launch → play → result → exit → next-session flow.",
    personDays:null, reviewed:false, dependencies:"", risk:"", scopeType:"mandatory"
  },
  {
    id:"qa", title:"Prime Hardware QA & Stabilization",
    currentImplementation:"",
    primeRequirement:"Validate large-screen rendering, multi-touch, performance, session cleanup and reliability on Prime hardware.",
    classification:"", whyChange:"", proposedImplementation:"",
    reusedComponents:"",
    changedComponents:"",
    deliverable:"Prime conversion QA checklist completed with blocking defects resolved.",
    personDays:null, reviewed:false, dependencies:"", risk:"", scopeType:"mandatory"
  }
];

