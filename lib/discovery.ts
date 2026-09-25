import { ChoiceOption, DiscoveryQuestion, DiscoverySection } from "./discoveryTypes";

export const DISCOVERY_INTRO =
  "This form helps us understand how the current game is built, so we can plan the Prime version together. There are no right or wrong answers — 'Not sure' is a useful answer when you note what needs checking. Allow approximately 1.5–2 hours for an initial response from a developer familiar with the project. Additional code investigation may take longer; record unresolved items rather than guessing. The two project files show versions and dependencies only; where something stays unclear, we may ask for specific scripts or a short walkthrough of that part.";

export const DISCOVERY_SECTIONS: DiscoverySection[] = [
  { id: "A", title: "Project snapshot" },
  { id: "B", title: "Game structure" },
  { id: "C", title: "Player model & networking" },
  { id: "D", title: "Game state & rules" },
  { id: "E", title: "Input" },
  { id: "F", title: "Screen & UI" },
  { id: "G", title: "Accounts, backend & match lifecycle" },
  { id: "H", title: "Testing" },
  { id: "I", title: "Your view" },
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

export const DISCOVERY_QUESTIONS: DiscoveryQuestion[] = [
  {
    id: "A1", section: "A", type: "single", tags: ["Risk"], evidence: "none", projectFiles: true,
    prompt: "Unity version?",
    options: choices(["2019 or older", "2020", "2021", "2022", "Unity 6"]),
  },
  {
    id: "A2", section: "A", type: "multi", tags: ["Engine"], evidence: "none",
    prompt: "Networking framework(s)?",
    options: choices(["Photon PUN 2", "Photon Fusion", "Photon Quantum", "Mirror", "Netcode for GameObjects", "Custom (sockets / WebSocket / HTTP)"]),
    followUps: [{ id: "A2-versions", kind: "text", prompt: "Version(s)" }],
  },
  {
    id: "B1", section: "B", type: "single", tags: ["Boards", "Engine"], evidence: "recommended", evidenceHint: "Main board class",
    prompt: "Does the game have a single-player mode?",
    options: choices(["Yes, sharing board and rules code with PvP", "Yes, with separate code", "No"]),
  },
  {
    id: "B2", section: "B", type: "single", tags: ["Boards"], evidence: "recommended", evidenceHint: "Which managers",
    prompt: "Are the gameplay managers singletons (e.g. GameManager.Instance)?",
    options: choices(["No", "Some", "Most"]),
    followUps: [{
      id: "B2-holds", kind: "multi", prompt: "Do any of them hold a single current…", showWhen: ["some", "most"],
      options: choices(["player", "board", "shooter", "score", "timer", "None of these"]),
    }],
  },
  {
    id: "B3", section: "B", type: "rows", tags: ["Boards"], evidence: "optional",
    prompt: "How do pause and timed rules work?",
    rows: [
      { id: "pause", label: "Pause", mode: "single", options: choices(["Global Time.timeScale", "Per-board pause", "No pause in PvP"]) },
      { id: "timed", label: "Timed rules (ceiling drop, countdown)", mode: "single", options: choices(["Per board", "Shared / global"]) },
    ],
  },
  {
    id: "C1", section: "C", type: "multi", tags: ["Engine"], evidence: "recommended",
    prompt: "How does the code tell 'me' from 'the opponent'?",
    options: choices(["Framework flag (IsMine / isLocalPlayer / IsOwner)", "Separate classes or prefabs", "Player ID or index passed around"]),
    followUps: [{ id: "C1-scripts", kind: "single", prompt: "Roughly how many scripts depend on it?", options: choices(["Under 5", "5–20", "Over 20"]) }],
  },
  {
    id: "C2", section: "C", type: "single", tags: ["Engine"], evidence: "recommended",
    prompt: "On each phone, how is the opponent's board produced?",
    options: choices(["Full simulation (runs the same rules from received moves)", "Display only (shows received board data)", "Mixed"]),
  },
  {
    id: "C3", section: "C", type: "rows", tags: ["Engine"], evidence: "optional",
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
    id: "C4", section: "C", type: "multi", tags: ["Engine"], evidence: "optional",
    prompt: "What is sent over the network during a match?",
    options: choices(["Each shot (angle / position)", "Board snapshots", "Attack / extra-row events", "Score / timer"]),
    followUps: [{ id: "C4-names", kind: "text", prompt: "Message or RPC names, if easy" }],
  },
  {
    id: "C5", section: "C", type: "rows", tags: ["Engine", "Boards"], evidence: "optional",
    prompt: "How are these generated?",
    rows: [
      { id: "colours", label: "Next-bubble colours", mode: "multi", options: GENERATION },
      { id: "incoming", label: "Incoming rows or opponent bubbles", mode: "multi", options: GENERATION },
    ],
  },
  {
    id: "C6", section: "C", type: "open", tags: ["Engine"], evidence: "none",
    prompt: "Trace one attack: P1 clears bubbles, then P2 receives extra rows. In 3–5 steps, show who decides how many bubbles P2 receives, how the event reaches P2, and where P2's board is changed.",
  },
  {
    id: "D1", section: "D", type: "single", tags: ["Engine", "Boards"], evidence: "recommended",
    prompt: "Where is the board state stored?",
    options: choices(["Plain C# data (grid array or class)", "In the scene's GameObjects", "A mix"]),
  },
  {
    id: "D2", section: "D", type: "single", tags: ["Engine"], evidence: "recommended",
    prompt: "Do the rules (matching, scoring, attacks, win/lose) call networking code directly?",
    options: choices(["No, they raise events or return results", "Some do", "Rules and networking are mixed in the same classes"]),
  },
  {
    id: "D3", section: "D", type: "open", tags: ["Engine"], evidence: "none",
    prompt: "From reading the code: which gameplay classes directly depend on the networking framework, and what would need adapting to run those rules locally? (No need to remove anything from the project.)",
  },
  {
    id: "D4", section: "D", type: "single", tags: ["Boards"], evidence: "optional",
    prompt: "How is bubble flight and bounce calculated?",
    options: choices(["Unity physics (Rigidbody / colliders)", "Custom raycast or maths", "A mix"]),
  },
  {
    id: "E1", section: "E", type: "multi", tags: ["Input"], evidence: "optional",
    prompt: "Which input system?",
    options: choices(["Old Input Manager", "New Input System", "Plugin (e.g. Lean Touch)", "Unity UI events"]),
  },
  {
    id: "E2", section: "E", type: "single", tags: ["Input"], evidence: "recommended",
    prompt: "During gameplay, how are touches read?",
    options: choices(["First touch only (e.g. GetTouch(0))", "Each finger tracked by ID", "Mouse emulation"]),
  },
  {
    id: "E3", section: "E", type: "single", tags: ["Input"], evidence: "recommended",
    prompt: "Where does input go?",
    options: choices(["Straight into the shooter object", "Through a controller or input interface"]),
  },
  {
    id: "F1", section: "F", type: "rows", tags: ["Screen"], evidence: "optional",
    prompt: "Camera and opponent view",
    rows: [
      { id: "camera", label: "Camera setup", mode: "single", options: choices(["One camera, fixed portrait", "One camera, adapts to screen shape", "Several cameras"]) },
      { id: "opponent", label: "Opponent's board on mobile", mode: "single", options: choices(["Full size", "Mini view", "Not shown"]) },
    ],
  },
  {
    id: "F2", section: "F", type: "single", tags: ["Screen", "Boards"], evidence: "optional",
    prompt: "Where does the HUD (score, timer, attack meter) get its data?",
    options: choices(["Directly from the 'local player'", "From a player reference or ID it's given", "Mixed"]),
  },
  {
    id: "G1", section: "G", type: "multi", tags: ["Platform"], evidence: "none",
    prompt: "How do players sign up and log in?",
    options: choices(["Guest / device ID", "Email & password", "Phone / OTP", "Google", "Apple", "Facebook", "Game Center / Play Games"]),
    followUps: [
      { id: "G1-guest", kind: "single", prompt: "Can players enter PvP as guests, without completing a sign-up process?", options: choices(["Yes", "No"]) },
      { id: "G1-tokens", kind: "text", prompt: "Which player IDs or authentication tokens do matchmaking and result submission require, and which class/service supplies them?" },
    ],
  },
  {
    id: "G2", section: "G", type: "multi", tags: ["Platform"], evidence: "none",
    prompt: "Which backend services are used?",
    options: choices(["Own server", "Photon", "PlayFab", "Firebase"]),
    followUps: [
      { id: "G2-jobs", kind: "text", prompt: "What each one does (accounts, matchmaking, results…)" },
      { id: "G2-code", kind: "single", prompt: "In the code:", options: choices(["One class or service per job", "Spread across several scripts"]) },
    ],
  },
  {
    id: "G3", section: "G", type: "open", tags: ["Platform", "Engine"], evidence: "none",
    prompt: "Which classes create the match, assign players, decide and submit the result, and clear the session? Briefly describe what happens if a player disconnects or exits early.",
  },
  {
    id: "H1", section: "H", type: "multi", tags: ["Risk"], evidence: "optional",
    prompt: "How is mobile PvP tested today?",
    options: choices(["Automated tests", "Written manual checklist", "Informal play-testing", "A match can run in the editor without two phones (e.g. ParrelSync / Multiplayer Play Mode)"]),
  },
  { id: "I1", section: "I", type: "open", tags: [], evidence: "none", prompt: "Which three parts need the most change for Prime, and why?" },
  { id: "I2", section: "I", type: "open", tags: [], evidence: "none", prompt: "Which parts do you expect can be kept?" },
  {
    id: "I3", section: "I", type: "open", tags: [], evidence: "none",
    prompt: "What approaches have you considered, or would you investigate? What are their main trade-offs, and why do you currently prefer one?",
  },
  { id: "I4", section: "I", type: "open", tags: [], evidence: "none", prompt: "What information from us would help you estimate with more confidence?" },
];

export const PROJECT_FILES = [
  { id: "projectVersion", label: "ProjectSettings/ProjectVersion.txt" },
  { id: "manifest", label: "Packages/manifest.json" },
];

export const PROJECT_FILE_LIMIT_BYTES = 200 * 1024;

export function sectionTitle(sectionId: string) {
  return DISCOVERY_SECTIONS.find((s) => s.id === sectionId)?.title ?? sectionId;
}
