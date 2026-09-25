import { Fragment, useEffect } from "react";
import { planFieldsDone, PLAN_FIELD_COUNT } from "@/lib/assessment";
import { DISCOVERY_SECTIONS } from "@/lib/discovery";
import { AnswerMap, discoveryCoverage } from "@/lib/discoveryAnswers";
import { OVERVIEW } from "@/lib/sections";
import { Stage } from "@/lib/stages";
import { AssessmentState } from "@/lib/types";
import { ThemeChoice } from "@/hooks/useTheme";
import ProgressRing from "./ProgressRing";
import SidebarSectionItem from "./SidebarSectionItem";
import UserBadge, { CurrentUser } from "./UserBadge";

type Props = {
  state: AssessmentState;
  active: string;
  theme: ThemeChoice;
  onNavigate: (view: string) => void;
  onOpenPalette: () => void;
  onTheme: (theme: ThemeChoice) => void;
  user: CurrentUser;
  /** Only stages the workflow has reached; the others are not listed at all. */
  stages: Stage[];
  /** The discovery answers shown (own for developers, the selected developer's for product). */
  answers: AnswerMap;
};

const THEMES: ThemeChoice[] = ["light", "system", "dark"];

export default function Sidebar({ state, active, theme, user, onNavigate, onOpenPalette, onTheme, stages, answers }: Props) {
  useEffect(() => {
    document.querySelector(".nav-item.on")?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [active]);

  const plansDone = state.plan.filter((w) => planFieldsDone(w) === PLAN_FIELD_COUNT).length;
  const navItem = (view: string, ring?: [number, number]) => (
    <button type="button" className={`nav-item ${active === view ? "on" : ""}`} aria-current={active === view ? "page" : undefined} onClick={() => onNavigate(view)}>
      {ring && <ProgressRing done={ring[0]} total={ring[1]} />}
      <span className="grow">{view}</span>
    </button>
  );
  const groupLabel = (stage: Stage) => (
    <div className="nav-group label">
      Step {stage.number} · {stage.title}
      {stage.id === "discovery" && ` · ${discoveryCoverage(answers)}%`}
    </div>
  );
  const stageItems = (stage: Stage) => {
    if (stage.id === "discovery") {
      return DISCOVERY_SECTIONS.map((s) => (
        <SidebarSectionItem key={s.id} answers={answers} section={s} active={active === s.title} onNavigate={onNavigate} />
      ));
    }
    return navItem(stage.view, stage.id === "plan" ? [plansDone, state.plan.length] : undefined);
  };

  return (
    <aside className="side">
      <div className="brand">
        <div className="brand-mark">P</div>
        <div>
          <b>Prime Conversion</b>
          <small>{state.gameInfo.gameName || "Untitled game"}</small>
        </div>
      </div>
      <UserBadge user={user} />
      <a className="back-link" href="/">← All games</a>
      <button type="button" className="search-btn" onClick={onOpenPalette}>
        Jump to… <kbd>⌘K</kbd>
      </button>
      <nav className="nav" aria-label="Sections">
        {navItem(OVERVIEW)}
        {stages.map((stage) => (
          <Fragment key={stage.id}>
            {groupLabel(stage)}
            {stageItems(stage)}
          </Fragment>
        ))}
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
      </div>
    </aside>
  );
}
