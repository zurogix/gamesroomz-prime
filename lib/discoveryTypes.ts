export type Tag = "Engine" | "Boards" | "Input" | "Screen" | "Platform" | "Risk";
export type Evidence = "none" | "optional" | "recommended";
export type ChoiceMode = "single" | "multi";
export type Basis = "confirmed" | "tested" | "assumption" | "investigate";

export type ChoiceOption = { id: string; label: string; exclusive?: boolean };

export type ChoiceFollowUp = {
  id: string;
  kind: ChoiceMode;
  prompt: string;
  options: ChoiceOption[];
  /** Only shown when one of these parent options is selected. */
  showWhen?: string[];
};

export type TextFollowUp = { id: string; kind: "text"; prompt: string; showWhen?: string[] };

export type FollowUp = ChoiceFollowUp | TextFollowUp;

export type RowDef = { id: string; label: string; mode: ChoiceMode; options: ChoiceOption[] };

type QuestionBase = {
  id: string;
  /** Short name shown in the "About this section" tips. */
  title: string;
  /** Why we ask — shown next to the title in the tips. */
  why: string;
  section: string;
  prompt: string;
  helper?: string;
  tags: Tag[];
  evidence: Evidence;
  evidenceHint?: string;
  followUps?: FollowUp[];
  /** Offers upload/paste of the Unity project version and package manifest. */
  projectFiles?: boolean;
};

export type ChoiceQuestion = QuestionBase & { type: ChoiceMode; options: ChoiceOption[] };
export type RowsQuestion = QuestionBase & { type: "rows"; rows: RowDef[] };
export type OpenQuestion = QuestionBase & { type: "open" };
export type DiscoveryQuestion = ChoiceQuestion | RowsQuestion | OpenQuestion;

export type DiscoverySection = { id: string; title: string; intro: string };

export type ChoiceAnswer = { selected: string[]; other: string };
export type FollowUpAnswer = ChoiceAnswer & { text: string };

export type QuestionAnswer = {
  choice: ChoiceAnswer;
  rows: Record<string, ChoiceAnswer>;
  text: string;
  notSureYet: boolean;
  needsChecking: string;
  followUps: Record<string, FollowUpAnswer>;
  evidence: string;
  basis: Basis | "";
  confirmBy: string;
  files: Record<string, string>;
};
