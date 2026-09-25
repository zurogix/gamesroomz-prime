import { DISCOVERY_SECTIONS } from "./discovery";
import { OVERVIEW } from "./sections";

export type SectionNav = {
  prev: { view: string; label: string };
  /** Null on the last section, where the submit action (or a note) takes its place. */
  next: { view: string; label: string } | null;
};

/** The pager buttons at the bottom of a discovery section. */
export function sectionNav(index: number): SectionNav {
  const prevView = index === 0 ? OVERVIEW : DISCOVERY_SECTIONS[index - 1].title;
  const nextSection = DISCOVERY_SECTIONS[index + 1];
  return {
    prev: { view: prevView, label: `← Previous: ${prevView}` },
    next: nextSection ? { view: nextSection.title, label: `Next: ${nextSection.title} →` } : null,
  };
}

export const PRODUCT_SUBMIT_NOTE = "The developer submits discovery from here.";
