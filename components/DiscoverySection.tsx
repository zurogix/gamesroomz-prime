"use client";

import { useEffect } from "react";
import { DISCOVERY_INTRO, DISCOVERY_QUESTIONS, DISCOVERY_SECTIONS } from "@/lib/discovery";
import { answerFor, sectionProgress } from "@/lib/discoveryAnswers";
import { QuestionAnswer } from "@/lib/discoveryTypes";
import { focusQuestion } from "@/lib/rail";
import { OVERVIEW, PLAN } from "@/lib/sections";
import { AssessmentState } from "@/lib/types";
import DiscoveryQuestionCard from "./DiscoveryQuestionCard";
import ExportMenu from "./ExportMenu";
import PageHeader from "./PageHeader";
import PrimeTargetsSummary from "./PrimeTargetsSummary";
import SectionTipsBox from "./SectionTipsBox";

type Props = {
  state: AssessmentState;
  sectionTitle: string;
  focusId: string | null;
  onAnswer: (id: string, update: (answer: QuestionAnswer) => QuestionAnswer) => void;
  onNavigate: (view: string) => void;
};

export default function DiscoverySection({ state, sectionTitle, focusId, onAnswer, onNavigate }: Props) {
  const index = DISCOVERY_SECTIONS.findIndex((s) => s.title === sectionTitle);
  const section = DISCOVERY_SECTIONS[index];
  const questions = DISCOVERY_QUESTIONS.filter((q) => q.section === section.id);
  const prev = index === 0 ? OVERVIEW : DISCOVERY_SECTIONS[index - 1].title;
  const next = index === DISCOVERY_SECTIONS.length - 1 ? PLAN : DISCOVERY_SECTIONS[index + 1].title;
  const { done, total } = sectionProgress(state.answers, section.id);

  useEffect(() => {
    if (!focusId) return;
    focusQuestion(focusId);
  }, [focusId, sectionTitle]);

  const crumb = <>Discovery <span>·</span> Section {section.id} of {DISCOVERY_SECTIONS.length} <span>·</span> {done}/{total} answered</>;

  return (
    <>
      <PageHeader title={`${section.id} · ${section.title}`} crumb={crumb} actions={<ExportMenu state={state} />} />
      <div className="content">
        {index === 0 && <p className="discovery-intro">{DISCOVERY_INTRO}</p>}
        <SectionTipsBox section={section} />
        <PrimeTargetsSummary targets={state.primeTargets} onEdit={() => onNavigate(OVERVIEW)} />
        <div className="dq-list">
          {questions.map((q) => (
            <DiscoveryQuestionCard
              key={q.id}
              question={q}
              answer={answerFor(state.answers, q.id)}
              onChange={(update) => onAnswer(q.id, update)}
            />
          ))}
        </div>
        <div className="pager">
          <span className="hint">Answers save automatically.</span>
          <div className="pager-actions">
            <button type="button" className="btn" onClick={() => onNavigate(prev)}>← {prev}</button>
            <button type="button" className="btn primary" onClick={() => onNavigate(next)}>{next} →</button>
          </div>
        </div>
      </div>
    </>
  );
}
