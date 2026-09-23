import { useEffect } from "react";
import { assessmentCoverage, planFieldsDone, PLAN_FIELD_COUNT } from "@/lib/assessment";
import { ASSESSMENT_SECTIONS, OVERVIEW, PLAN, SUMMARY } from "@/lib/sections";
import { AssessmentState } from "@/lib/types";
import { ThemeChoice } from "@/hooks/useTheme";
import ProgressRing from "./ProgressRing";
import SidebarSectionItem from "./SidebarSectionItem";

type Props = {
  state: AssessmentState;
  active: string;
  theme: ThemeChoice;
  onNavigate: (view: string) => void;
  onOpenPalette: () => void;
  onTheme: (theme: ThemeChoice) => void;
  onReset: () => void;
};

const THEMES: ThemeChoice[] = ["light", "system", "dark"];

export default function Sidebar({ state, active, theme, onNavigate, onOpenPalette, onTheme, onReset }: Props) {
  useEffect(() => {
    document.querySelector(".nav-item.on")?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [active]);

  const plansDone = state.plan.filter((w) => planFieldsDone(w) === PLAN_FIELD_COUNT).length;
  const checksDone = state.checks.filter(Boolean).length;
  const navItem = (view: string, ring?: [number, number]) => (
    <button type="button" className={`nav-item ${active === view ? "on" : ""}`} aria-current={active === view ? "page" : undefined} onClick={() => onNavigate(view)}>
      {ring && <ProgressRing done={ring[0]} total={ring[1]} />}
      <span className="grow">{view}</span>
    </button>
  );

  return (
    <aside className="side">
      <div className="brand">
        <div className="brand-mark">P</div>
        <div>
          <b>Prime Conversion</b>
          <small>{state.gameInfo.gameName || "Untitled game"}</small>
        </div>
      </div>
      <button type="button" className="search-btn" onClick={onOpenPalette}>
        Jump to… <kbd>⌘K</kbd>
      </button>
      <nav className="nav" aria-label="Sections">
        {navItem(OVERVIEW)}
        <div className="nav-group label">Assessment · {assessmentCoverage(state)}%</div>
        {ASSESSMENT_SECTIONS.map((s) => (
          <SidebarSectionItem key={s} state={state} section={s} active={active === s} onNavigate={onNavigate} />
        ))}
        <div className="nav-group label">Plan & report</div>
        {navItem(PLAN, [plansDone, state.plan.length])}
        {navItem(SUMMARY, [checksDone, state.checks.length])}
      </nav>
      <div className="side-foot">
        <span className="label">Theme</span>
        <div className="theme-row">
          {THEMES.map((t) => (
            <button key={t} type="button" className={theme === t ? "on" : ""} aria-pressed={theme === t} onClick={() => onTheme(t)}>
              {t[0].toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        <button type="button" className="btn quiet reset-btn" onClick={onReset}>Reset assessment</button>
      </div>
    </aside>
  );
}
