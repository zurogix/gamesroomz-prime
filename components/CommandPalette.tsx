"use client";

import { KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { questions } from "@/lib/questions";
import { ASSESSMENT_SECTIONS, OVERVIEW, PLAN, SUMMARY } from "@/lib/sections";
import { Workstream } from "@/lib/types";

export type PaletteTarget = { view?: string; questionId?: string; workstreamId?: string };
type Item = PaletteTarget & { text: string; kind: string };

type Props = {
  plan: Workstream[];
  onPick: (target: PaletteTarget) => void;
  onClose: () => void;
};

const MAX_RESULTS = 40;

function buildItems(plan: Workstream[]): Item[] {
  const views = [OVERVIEW, ...ASSESSMENT_SECTIONS, PLAN, SUMMARY].map((v) => ({ text: v, kind: "Section", view: v }));
  const qs = questions.map((q) => ({ text: q.prompt, kind: q.section, questionId: q.id }));
  const ws = plan.map((w) => ({ text: w.title, kind: "Workstream", workstreamId: w.id }));
  return [...views, ...qs, ...ws];
}

export default function CommandPalette({ plan, onPick, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const all = useMemo(() => buildItems(plan), [plan]);
  const needle = query.trim().toLowerCase();
  const items = (needle ? all.filter((i) => `${i.text} ${i.kind}`.toLowerCase().includes(needle)) : all).slice(0, MAX_RESULTS);

  useEffect(() => {
    input.current?.focus();
  }, []);

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") return onClose();
    if (e.key === "ArrowDown") {
      e.preventDefault();
      return setActive((a) => Math.min(items.length - 1, a + 1));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      return setActive((a) => Math.max(0, a - 1));
    }
    if (e.key === "Enter" && items[active]) {
      e.preventDefault();
      onPick(items[active]);
    }
  }

  return (
    <>
      <div className="scrim scrim-top" onClick={onClose} aria-hidden="true" />
      <div className="palette" role="dialog" aria-label="Jump to">
        <input
          ref={input}
          type="text"
          id="palette-input"
          placeholder="Search sections, questions, workstreams…"
          autoComplete="off"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          onKeyDown={onKeyDown}
        />
        <ul role="listbox">
          {items.length === 0 && <li className="empty">No matches for “{query}”.</li>}
          {items.map((item, i) => (
            <li
              key={`${item.kind}-${item.text}`}
              role="option"
              aria-selected={i === active}
              className={i === active ? "on" : ""}
              onMouseEnter={() => setActive(i)}
              onClick={() => onPick(item)}
            >
              <span>{item.text}</span>
              <small>{item.kind}</small>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
