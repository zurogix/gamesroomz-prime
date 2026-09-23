"use client";

import { useEffect, useRef, useState } from "react";
import { isQuestionDone } from "@/lib/assessment";
import { questions } from "@/lib/questions";
import { ANSWERS, ASSESSMENT_SECTIONS, OVERVIEW, PLAN } from "@/lib/sections";
import { AssessmentState, Classification, QuestionResponse } from "@/lib/types";
import PageHeader from "./PageHeader";
import QuestionRow from "./QuestionRow";

type Props = {
  state: AssessmentState;
  section: string;
  savedAt: number | null;
  focusId: string | null;
  onChange: (id: string, patch: Partial<QuestionResponse>) => void;
  onNavigate: (view: string) => void;
  onContinueToPlan: () => void;
};

const IMPACT_KEYS: Record<string, Classification> = { r: "reuse", m: "modify", w: "rewrite", n: "new" };

function isTyping(target: EventTarget | null) {
  return target instanceof HTMLElement && Boolean(target.closest("input, textarea, select, [contenteditable]"));
}

export default function AssessmentSection({ state, section, savedAt, focusId, onChange, onNavigate, onContinueToPlan }: Props) {
  const sectionQs = questions.filter((q) => q.section === section);
  const index = ASSESSMENT_SECTIONS.indexOf(section);
  const prev = index === 0 ? OVERVIEW : ASSESSMENT_SECTIONS[index - 1];
  const next = index === ASSESSMENT_SECTIONS.length - 1 ? PLAN : ASSESSMENT_SECTIONS[index + 1];
  const focusIndex = sectionQs.findIndex((q) => q.id === focusId);
  const initialFocus = Math.max(0, focusIndex);
  const [focus, setFocus] = useState(initialFocus);
  const rows = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    setFocus(initialFocus);
    if (focusIndex < 0) return;
    const row = rows.current[initialFocus];
    row?.scrollIntoView({ block: "center" });
    row?.querySelector("textarea")?.focus();
  }, [section, focusIndex, initialFocus]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (isTyping(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;
      const q = sectionQs[focus];
      if (!q) return;
      const key = e.key.toLowerCase();
      const move = (delta: number) => {
        e.preventDefault();
        const target = Math.max(0, Math.min(sectionQs.length - 1, focus + delta));
        setFocus(target);
        rows.current[target]?.scrollIntoView({ block: "nearest" });
      };
      if (key === "j") return move(1);
      if (key === "k") return move(-1);
      const answer = ANSWERS[Number(key) - 1];
      const current = state.responses[q.id];
      if (answer) return onChange(q.id, { classification: "", answer: current.answer === answer.value ? "" : answer.value });
      const impact = IMPACT_KEYS[key];
      if (impact) {
        const classification = current.classification === impact ? "" : impact;
        onChange(q.id, { classification, answer: classification ? "yes" : "" });
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focus, sectionQs, state.responses, onChange]);

  const done = sectionQs.filter((q) => isQuestionDone(state, q)).length;
  const crumb = <>Assessment <span>·</span> Section {index + 1} of {ASSESSMENT_SECTIONS.length} <span>·</span> {done}/{sectionQs.length} complete</>;
  const goNext = () => (next === PLAN ? onContinueToPlan() : onNavigate(next));

  return (
    <>
      <PageHeader title={section} crumb={crumb} savedAt={savedAt} />
      <div className="content">
        <p className="hint">Choose one action and add a brief finding. Estimate effort once per workstream in the Conversion Plan. Unresolved items remain incomplete.</p>
        <div className="section-card">
          {sectionQs.map((q, i) => (
            <QuestionRow
              key={q.id}
              ref={(el) => { rows.current[i] = el; }}
              question={q}
              number={questions.indexOf(q) + 1}
              response={state.responses[q.id]}
              focused={focus === i}
              onFocus={() => setFocus(i)}
              onChange={(patch) => onChange(q.id, patch)}
            />
          ))}
        </div>
        <div className="pager">
          <div className="shortcuts" aria-hidden="true">
            <span><kbd>J</kbd><kbd>K</kbd> move</span>
            <span><kbd>1</kbd><kbd>2</kbd> unresolved</span>
            <span><kbd>R</kbd><kbd>M</kbd><kbd>W</kbd><kbd>N</kbd> impact</span>
          </div>
          <div className="pager-actions">
            <button type="button" className="btn" onClick={() => onNavigate(prev)}>← {prev}</button>
            <button type="button" className="btn primary" onClick={goNext}>{next} →</button>
          </div>
        </div>
      </div>
    </>
  );
}

