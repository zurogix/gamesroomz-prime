import { Category, Workstream } from "./types";

const PLATFORM_WORKSTREAMS = ["gamesroomz-integration", "score-results", "launcher-lifecycle", "qa"];
const ENGINE_EXCLUSION = "Excludes core engine refactoring already estimated in Multiplayer Engine 2.0.";

/**
 * Current-game fields start empty: they are filled from the discovery answers,
 * not guessed in advance. Requirements, deliverables and dependencies are kept.
 */
const planData: Omit<Workstream, "category">[] = [
  {
    id:"technical-investigation", title:"Technical Investigation",
    currentImplementation:"",
    primeRequirement:"Establish a verified baseline of project health, dependencies and build status before conversion.",
    classification:"", whyChange:"", proposedImplementation:"",
    reusedComponents:"",
    changedComponents:"",
    deliverable:"Technical baseline report and verified build/open status.",
    personDays:0, dependencies:"Access to full source, historical SDKs/plugins and developer environment.", risk:"medium", scopeType:"mandatory"
  },
  {
    id:"unity-modernization", title:"Unity Modernization",
    currentImplementation:"",
    primeRequirement:"Run on one agreed, supported Unity version for Prime and future Gamesroomz SDK maintenance.",
    classification:"", whyChange:"", proposedImplementation:"",
    reusedComponents:"",
    changedComponents:"",
    deliverable:"Project opens, compiles and runs cleanly on the agreed Prime Unity version.",
    personDays:0, dependencies:"Target Unity version must be agreed.", risk:"medium", scopeType:"mandatory"
  },
  {
    id:"android-modernization", title:"Android Toolchain Modernization",
    currentImplementation:"",
    primeRequirement:"Produce a stable Android build compatible with the Prime OS and hardware baseline.",
    classification:"", whyChange:"", proposedImplementation:"",
    reusedComponents:"",
    changedComponents:"",
    deliverable:"Installable Prime-compatible Android build.",
    personDays:0, dependencies:"Prime Android OS/API baseline and hardware access.", risk:"medium", scopeType:"mandatory"
  },
  {
    id:"core-gameplay", title:"Core Gameplay",
    currentImplementation:"",
    primeRequirement:"Retain proven gameplay unless a Prime constraint makes a change necessary.",
    classification:"", whyChange:"", proposedImplementation:"",
    reusedComponents:"",
    changedComponents:"",
    deliverable:"Prime build preserves the intended Bubble Shooter gameplay.",
    personDays:0, dependencies:"Multiplayer architecture decisions.", risk:"low", scopeType:"mandatory"
  },
  {
    id:"multiplayer-engine-2", title:"Multiplayer Engine 2.0 Architecture",
    currentImplementation:"",
    primeRequirement:"Support Prime shared-device multiplayer, choosing between one player-agnostic core shared with mobile PvP and a separate Prime engine based on the cost, risk and maintenance comparison.",
    classification:"", whyChange:"", proposedImplementation:"",
    reusedComponents:"",
    changedComponents:"",
    deliverable:"Agreed architecture path with a phased migration plan, mobile regression protection, Prime adapter design, and implementation effort for the recommended path.",
    personDays:0, dependencies:"Current networking framework/code review, mobile regression baseline, Prime input model and Gamesroomz session contract.", risk:"high", scopeType:"mandatory"
  },
  {
    id:"player-controller", title:"Player Controller",
    currentImplementation:"",
    primeRequirement:"Independent P1 and P2 controllers inside the same game instance.",
    classification:"", whyChange:"", proposedImplementation:"",
    reusedComponents:"",
    changedComponents:ENGINE_EXCLUSION,
    deliverable:"Two independent player controllers with no cross-control leakage.",
    personDays:0, dependencies:"Multiplayer Engine 2.0 architecture decision.", risk:"high", scopeType:"mandatory"
  },
  {
    id:"multi-touch", title:"Multi-Touch Input",
    currentImplementation:"",
    primeRequirement:"P1 and P2 must aim/shoot simultaneously on separate tabletop regions.",
    classification:"", whyChange:"", proposedImplementation:"",
    reusedComponents:"",
    changedComponents:ENGINE_EXCLUSION,
    deliverable:"Reliable simultaneous multi-touch with independent P1/P2 input.",
    personDays:0, dependencies:"Final Prime screen layout and hardware touch behaviour.", risk:"high", scopeType:"mandatory"
  },
  {
    id:"prime-ui", title:"Prime 16:9 Tabletop UI",
    currentImplementation:"",
    primeRequirement:"Tabletop layout as defined in Prime targets; opposite player UI may require 180° orientation.",
    classification:"", whyChange:"", proposedImplementation:"",
    reusedComponents:"",
    changedComponents:"",
    deliverable:"Readable and usable two-player Prime tabletop interface.",
    personDays:0, dependencies:"Approved Prime UX/layout.", risk:"medium", scopeType:"mandatory"
  },
  {
    id:"networking", title:"Networking",
    currentImplementation:"",
    primeRequirement:"Same-table gameplay should run locally where practical; backend remains responsible for platform/session/result needs.",
    classification:"", whyChange:"", proposedImplementation:"",
    reusedComponents:"",
    changedComponents:ENGINE_EXCLUSION,
    deliverable:"Stable local Prime match with only required backend communications.",
    personDays:0, dependencies:"Gamesroomz platform contract and future online PvP scope.", risk:"medium", scopeType:"mandatory"
  },
  {
    id:"gamesroomz-integration", title:"Gamesroomz SDK Integration",
    currentImplementation:"",
    primeRequirement:"Gamesroomz provides authenticated player identity, session and player-seat information.",
    classification:"", whyChange:"", proposedImplementation:"",
    reusedComponents:"",
    changedComponents:"",
    deliverable:"Game initializes from Gamesroomz and receives P1/P2 session data.",
    personDays:0, dependencies:"Gamesroomz Unity SDK/API specification.", risk:"medium", scopeType:"mandatory"
  },
  {
    id:"score-results", title:"Score & Result Integration",
    currentImplementation:"",
    primeRequirement:"Submit P1/P2 result, winner and agreed game metrics through Gamesroomz.",
    classification:"", whyChange:"", proposedImplementation:"",
    reusedComponents:"",
    changedComponents:"",
    deliverable:"Verified result reaches Gamesroomz for both players.",
    personDays:0, dependencies:"Gamesroomz result schema.", risk:"low", scopeType:"mandatory"
  },
  {
    id:"launcher-lifecycle", title:"Prime Launcher Lifecycle",
    currentImplementation:"",
    primeRequirement:"Prime launcher starts the game with a session and receives clean termination/return control.",
    classification:"", whyChange:"", proposedImplementation:"",
    reusedComponents:"",
    changedComponents:"",
    deliverable:"Repeatable launch → play → result → exit → next-session flow.",
    personDays:0, dependencies:"Prime launcher contract.", risk:"medium", scopeType:"mandatory"
  },
  {
    id:"qa", title:"Prime Hardware QA & Stabilization",
    currentImplementation:"",
    primeRequirement:"Validate large-screen rendering, multi-touch, performance, session cleanup and reliability on Prime hardware.",
    classification:"", whyChange:"", proposedImplementation:"",
    reusedComponents:"",
    changedComponents:"",
    deliverable:"Prime conversion QA checklist completed with blocking defects resolved.",
    personDays:0, dependencies:"Access to representative Prime hardware.", risk:"medium", scopeType:"mandatory"
  }
];

const categoryFor = (id: string): Category => (PLATFORM_WORKSTREAMS.includes(id) ? "platform" : "game");

export const planTemplate: Workstream[] = planData.map((w) => ({ ...w, category: categoryFor(w.id) }));
