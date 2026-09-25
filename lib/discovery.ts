import { ChoiceOption, DiscoveryQuestion, DiscoverySection } from "./discoveryTypes";

export const DISCOVERY_INTRO =
  "This form helps us understand how the current game is built, so we can plan the Prime version together. There are no right or wrong answers — 'Not sure' is a useful answer when you note what needs checking. Some answers may need a look at the code; record unresolved items rather than guessing. The two project files show versions and dependencies only; where something stays unclear, we may ask for specific scripts or a short walkthrough of that part.";

export const DISCOVERY_SECTIONS: DiscoverySection[] = [
  { id: "A", title: "Project snapshot", intro: "Sets the technical starting point." },
  { id: "B", title: "Game structure", intro: "How the game is organised, and what that means for running two boards in one game." },
  { id: "C", title: "Player model & networking", intro: "How players and the network are handled today." },
  { id: "D", title: "Game state & rules", intro: "Where the board and rules live, and how tied they are to networking." },
  { id: "E", title: "Input", intro: "How touches become shots." },
  { id: "F", title: "Screen & UI", intro: "How the screen is built today." },
  { id: "G", title: "Accounts, backend & match lifecycle", intro: "Accounts, backend services and the life of a match." },
  { id: "H", title: "Testing", intro: "How mobile PvP is protected today." },
  { id: "I", title: "Your view", intro: "Your own view of the work. This is where your reasoning and ideas matter most." },
];

const EXCLUSIVE_LABELS = ["None of these"];

export function slug(label: string) {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

/** Builds options from labels; "None of these" is exclusive with every other option. */
export function choices(labels: string[]): ChoiceOption[] {
  return labels.map((label) => ({
    id: slug(label),
    label,
    ...(EXCLUSIVE_LABELS.includes(label) ? { exclusive: true } : {}),
  }));
}

const DECIDERS = choices(["Dedicated game server", "Host phone", "Each phone for its own player", "Backend service"]);
const GENERATION = choices(["Shared random seed", "Sent over the network", "Generated independently on each phone"]);

export const NOT_SURE_TIP = "'Not sure' is fine — add what you'd need to check if you can.";

export const DISCOVERY_QUESTIONS: DiscoveryQuestion[] = [
  {
    id: "A1", title: "Unity version", why: "Shows how much upgrade work may be needed; the target version will be agreed with you later. The two files give exact versions, so no extra detail is needed.",
    section: "A", type: "single", tags: ["Risk"], evidence: "none", projectFiles: true,
    prompt: "Unity version?",
    options: choices(["2019 or older", "2020", "2021", "2022", "Unity 6"]),
  },
  {
    id: "A2", title: "Networking framework", why: "Each framework handles players and connections differently; some offer local or host modes that may help on Prime.",
    section: "A", type: "multi", tags: ["Engine"], evidence: "none",
    prompt: "Networking framework(s)?",
    options: choices(["Photon PUN 2", "Photon Fusion", "Photon Quantum", "Mirror", "Netcode for GameObjects", "Custom (sockets / WebSocket / HTTP)"]),
    followUps: [{ id: "A2-versions", kind: "text", prompt: "Version(s)" }],
  },
  {
    id: "B1", title: "Single-player mode", why: "Single-player code often runs a board without networking, so it may be a useful starting point.",
    section: "B", type: "single", tags: ["Boards", "Engine"], evidence: "recommended", evidenceHint: "Main board class",
    prompt: "Does the game have a single-player mode?",
    options: choices(["Yes, sharing board and rules code with PvP", "Yes, with separate code", "No"]),
  },
  {
    id: "B2", title: "Singletons", why: "Prime runs two boards in one game. A manager holding one 'current' player, board or score may need changes; a shared service usually doesn't.",
    section: "B", type: "single", tags: ["Boards"], evidence: "recommended", evidenceHint: "Which managers",
    prompt: "Are the gameplay managers singletons (e.g. GameManager.Instance)?",
    options: choices(["No", "Some", "Most"]),
    followUps: [{
      id: "B2-holds", kind: "multi", prompt: "Do any of them hold a single current…", showWhen: ["some", "most"],
      options: choices(["player", "board", "shooter", "score", "timer", "None of these"]),
    }],
  },
  {
    id: "B3", title: "Pause and timers", why: "On a shared screen, a global pause or timer affects both players at once.",
    section: "B", type: "rows", tags: ["Boards"], evidence: "optional",
    prompt: "How do pause and timed rules work?",
    rows: [
      { id: "pause", label: "Pause", mode: "single", options: choices(["Global Time.timeScale", "Per-board pause", "No pause in PvP"]) },
      { id: "timed", label: "Timed rules (ceiling drop, countdown)", mode: "single", options: choices(["Per board", "Shared / global"]) },
    ],
  },
  {
    id: "C1", title: "Me vs opponent", why: "On Prime both players are local, so we need to know how the code separates them today.",
    section: "C", type: "multi", tags: ["Engine"], evidence: "recommended",
    prompt: "How does the code tell 'me' from 'the opponent'?",
    options: choices(["Framework flag (IsMine / isLocalPlayer / IsOwner)", "Separate classes or prefabs", "Player ID or index passed around"]),
    followUps: [{ id: "C1-scripts", kind: "single", prompt: "Roughly how many scripts depend on it?", options: choices(["Under 5", "5–20", "Over 20"]) }],
  },
  {
    id: "C2", title: "Opponent's board", why: "A full simulation already runs the rules for two boards; a display-only board would need its logic added.",
    section: "C", type: "single", tags: ["Engine"], evidence: "recommended",
    prompt: "On each phone, how is the opponent's board produced?",
    options: choices(["Full simulation (runs the same rules from received moves)", "Display only (shows received board data)", "Mixed"]),
  },
  {
    id: "C3", title: "Who decides", why: "Shows where decisions are made today, and what may move into the game when both players share one device.",
    section: "C", type: "rows", tags: ["Engine"], evidence: "optional",
    prompt: "Who decides or validates each part of the match?",
    helper: "If responsibilities are shared, briefly explain who calculates and who validates. A service that only relays messages should not be marked as the decision-maker.",
    rows: [
      { id: "board", label: "Board state and moves", mode: "multi", options: DECIDERS },
      { id: "sent", label: "Amount of bubbles sent to the opponent", mode: "multi", options: DECIDERS },
      { id: "result", label: "Final match result", mode: "multi", options: DECIDERS },
    ],
    followUps: [{ id: "C3-shared", kind: "text", prompt: "Shared responsibilities (if any)" }],
  },
  {
    id: "C4", title: "What is sent", why: "Shows how closely gameplay and networking are connected.",
    section: "C", type: "multi", tags: ["Engine"], evidence: "optional",
    prompt: "What is sent over the network during a match?",
    options: choices(["Each shot (angle / position)", "Board snapshots", "Attack / extra-row events", "Score / timer"]),
    followUps: [{ id: "C4-names", kind: "text", prompt: "Message or RPC names, if easy" }],
  },
  {
    id: "C5", title: "How generated", why: "Affects whether both boards can run in one game without changing how bubbles are created.",
    section: "C", type: "rows", tags: ["Engine", "Boards"], evidence: "optional",
    prompt: "How are these generated?",
    rows: [
      { id: "colours", label: "Next-bubble colours", mode: "multi", options: GENERATION },
      { id: "incoming", label: "Incoming rows or opponent bubbles", mode: "multi", options: GENERATION },
    ],
  },
  {
    id: "C6", title: "Trace one attack", why: "One concrete example that connects rules, players, networking and board state.",
    section: "C", type: "open", tags: ["Engine"], evidence: "none",
    prompt: "Trace one attack: P1 clears bubbles, then P2 receives extra rows. In 3–5 steps, show who decides how many bubbles P2 receives, how the event reaches P2, and where P2's board is changed.",
  },
  {
    id: "D1", title: "Board storage", why: "Plain data is easier to run twice or share; state held in scene objects may need more restructuring.",
    section: "D", type: "single", tags: ["Engine", "Boards"], evidence: "recommended",
    prompt: "Where is the board state stored?",
    options: choices(["Plain C# data (grid array or class)", "In the scene's GameObjects", "A mix"]),
  },
  {
    id: "D2", title: "Rules and networking", why: "Shows whether the rules can run locally as they are.",
    section: "D", type: "single", tags: ["Engine"], evidence: "recommended",
    prompt: "Do the rules (matching, scoring, attacks, win/lose) call networking code directly?",
    options: choices(["No, they raise events or return results", "Some do", "Rules and networking are mixed in the same classes"]),
  },
  {
    id: "D3", title: "Networking dependencies", why: "Lists the specific classes to adapt — a direct input to the effort estimate.",
    section: "D", type: "open", tags: ["Engine"], evidence: "none",
    prompt: "From reading the code: which gameplay classes directly depend on the networking framework, and what would need adapting to run those rules locally? (No need to remove anything from the project.)",
  },
  {
    id: "D4", title: "Bubble flight", why: "Two boards using Unity physics in one scene may need to be kept apart (e.g. layers).",
    section: "D", type: "single", tags: ["Boards"], evidence: "optional",
    prompt: "How is bubble flight and bounce calculated?",
    options: choices(["Unity physics (Rigidbody / colliders)", "Custom raycast or maths", "A mix"]),
  },
  {
    id: "E1", title: "Input system", why: "Affects how two-player multi-touch is added.",
    section: "E", type: "multi", tags: ["Input"], evidence: "optional",
    prompt: "Which input system?",
    options: choices(["Old Input Manager", "New Input System", "Plugin (e.g. Lean Touch)", "Unity UI events"]),
  },
  {
    id: "E2", title: "Reading touches", why: "Prime needs two players touching at the same time; reading only the first touch would need changes.",
    section: "E", type: "single", tags: ["Input"], evidence: "recommended",
    prompt: "During gameplay, how are touches read?",
    options: choices(["First touch only (e.g. GetTouch(0))", "Each finger tracked by ID", "Mouse emulation"]),
  },
  {
    id: "E3", title: "Where input goes", why: "A controller layer can often accept a second input source with little change.",
    section: "E", type: "single", tags: ["Input"], evidence: "recommended",
    prompt: "Where does input go?",
    options: choices(["Straight into the shooter object", "Through a controller or input interface"]),
  },
  {
    id: "F1", title: "Camera and opponent view", why: "Shows how the display could be split into two playfields on one 16:9 screen.",
    section: "F", type: "rows", tags: ["Screen"], evidence: "optional",
    prompt: "Camera and opponent view",
    rows: [
      { id: "camera", label: "Camera setup", mode: "single", options: choices(["One camera, fixed portrait", "One camera, adapts to screen shape", "Several cameras"]) },
      { id: "opponent", label: "Opponent's board on mobile", mode: "single", options: choices(["Full size", "Mini view", "Not shown"]) },
    ],
  },
  {
    id: "F2", title: "HUD data", why: "On Prime each player needs their own score, timer and attack meter.",
    section: "F", type: "single", tags: ["Screen", "Boards"], evidence: "optional",
    prompt: "Where does the HUD (score, timer, attack meter) get its data?",
    options: choices(["Directly from the 'local player'", "From a player reference or ID it's given", "Mixed"]),
  },
  {
    id: "G1", title: "Sign-up and login", why: "On Prime, Gamesroomz supplies player identity. The IDs and tokens needed show how deep that change goes.",
    section: "G", type: "multi", tags: ["Platform"], evidence: "none",
    prompt: "How do players sign up and log in?",
    options: choices(["Guest / device ID", "Email & password", "Phone / OTP", "Google", "Apple", "Facebook", "Game Center / Play Games"]),
    followUps: [
      { id: "G1-guest", kind: "single", prompt: "Can players enter PvP as guests, without completing a sign-up process?", options: choices(["Yes", "No"]) },
      { id: "G1-tokens", kind: "text", prompt: "Which player IDs or authentication tokens do matchmaking and result submission require, and which class/service supplies them?" },
    ],
  },
  {
    id: "G2", title: "Backend services", why: "Shows which services stay, change, or are replaced by Gamesroomz.",
    section: "G", type: "multi", tags: ["Platform"], evidence: "none",
    prompt: "Which backend services are used?",
    options: choices(["Own server", "Photon", "PlayFab", "Firebase"]),
    followUps: [
      { id: "G2-jobs", kind: "text", prompt: "What each one does (accounts, matchmaking, results…)" },
      { id: "G2-code", kind: "single", prompt: "In the code:", options: choices(["One class or service per job", "Spread across several scripts"]) },
    ],
  },
  {
    id: "G3", title: "Match lifecycle", why: "Prime runs repeated sessions at a public table, so start, result, early exit and clean-up all matter.",
    section: "G", type: "open", tags: ["Platform", "Engine"], evidence: "none",
    prompt: "Which classes create the match, assign players, decide and submit the result, and clear the session? Briefly describe what happens if a player disconnects or exits early.",
  },
  {
    id: "H1", title: "Testing today", why: "Helps keep mobile PvP working while changes are made.",
    section: "H", type: "multi", tags: ["Risk"], evidence: "optional",
    prompt: "How is mobile PvP tested today?",
    options: choices(["Automated tests", "Written manual checklist", "Informal play-testing", "A match can run in the editor without two phones (e.g. ParrelSync / Multiplayer Play Mode)"]),
  },
  { id: "I1", title: "Most change", why: "Where you expect the main effort, and why.",
    section: "I", type: "open", tags: [], evidence: "none", prompt: "Which three parts need the most change for Prime, and why?" },
  { id: "I2", title: "What can be kept", why: "What you expect to carry over as it is.",
    section: "I", type: "open", tags: [], evidence: "none", prompt: "Which parts do you expect can be kept?" },
  {
    id: "I3", title: "Approaches", why: "Options worth comparing, including ones not yet investigated.",
    section: "I", type: "open", tags: [], evidence: "none",
    prompt: "What approaches have you considered, or would you investigate? What are their main trade-offs, and why do you currently prefer one?",
  },
  { id: "I4", title: "What you need from us", why: "Information that would make your estimate more confident.",
    section: "I", type: "open", tags: [], evidence: "none", prompt: "What information from us would help you estimate with more confidence?" },
];

export const PROJECT_FILES = [
  { id: "projectVersion", label: "ProjectSettings/ProjectVersion.txt" },
  { id: "manifest", label: "Packages/manifest.json" },
];

export const PROJECT_FILE_LIMIT_BYTES = 200 * 1024;

export function sectionTitle(sectionId: string) {
  return DISCOVERY_SECTIONS.find((s) => s.id === sectionId)?.title ?? sectionId;
}
