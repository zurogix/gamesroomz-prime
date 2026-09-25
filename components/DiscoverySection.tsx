"use client";

import { ReactNode, useEffect } from "react";
import { DISCOVERY_INTRO, DISCOVERY_QUESTIONS, DISCOVERY_SECTIONS } from "@/lib/discovery";
import { AnswerMap, answerFor, isAnswered, sectionProgress } from "@/lib/discoveryAnswers";
import { QuestionAnswer } from "@/lib/discoveryTypes";
import { focusQuestion } from "@/lib/rail";
import { ExportResponse } from "@/lib/exportMarkdown";
import { PRODUCT_SUBMIT_NOTE, sectionNav } from "@/lib/sectionNav";
import { AssessmentState } from "@/lib/types";
import DiscoveryQuestionCard from "./DiscoveryQuestionCard";
import ExportMenu from "./ExportMenu";
import PageHeader from "./PageHeader";
import SectionTipsBox from "./SectionTipsBox";
import WhatHappensNext from "./stages/WhatHappensNext";

type Props = {
  state: AssessmentState;
  answers: AnswerMap;
  sectionTitle: string;
  focusId: string | null;
  onAnswer: (id: string, update: (answer: QuestionAnswer) => QuestionAnswer) => void;
  onNavigate: (view: string) => void;
  /** Only a developer editing their own in-progress response; everyone else reads. */
  canEditAnswers: boolean;
  showWhatHappensNext: boolean;
  /** After a blocked submit, unanswered questions are marked "Needs an answer". */
  markUnanswered: boolean;
  /** Product sees a note on the last section where the developer's submit button is. */
  showProductNote: boolean;
  stageActions?: ReactNode;
  /** The developer's own "Submit discovery" button, when they can submit. */
  submitAction?: ReactNode;
  /** Product: the "Viewing: [developer]" picker. */
  viewerSlot?: ReactNode;
  exportResponses: ExportResponse[];
};

export default function DiscoverySection({ state, answers, sectionTitle, focusId, onAnswer, onNavigate, canEditAnswers, showWhatHappensNext, markUnanswered, showProductNote, stageActions, submitAction, viewerSlot, exportResponses }: Props) {
  const index = DISCOVERY_SECTIONS.findIndex((s) => s.title === sectionTitle);
  const section = DISCOVERY_SECTIONS[index];
  const questions = DISCOVERY_QUESTIONS.filter((q) => q.section === section.id);
  const { prev, next } = sectionNav(index);
  const { done, total } = sectionProgress(answers, section.id);

  useEffect(() => {
    if (!focusId) return;
    focusQuestion(focusId);
  }, [focusId, sectionTitle]);

  const crumb = <>Discovery <span>·</span> Section {section.id} of {DISCOVERY_SECTIONS.length} <span>·</span> {done}/{total} answered</>;

  return (
    <>
      <PageHeader title={`${section.id} · ${section.title}`} crumb={crumb} actions={<><ExportMenu state={state} responses={exportResponses} />{submitAction}{stageActions}</>} />
      <div className="content">
        {viewerSlot}
        {showWhatHappensNext && <WhatHappensNext />}
        {index === 0 && <p className="discovery-intro">{DISCOVERY_INTRO}</p>}
        <SectionTipsBox section={section} />
        <fieldset className="bare-fieldset dq-list" disabled={!canEditAnswers}>
          {questions.map((q) => {
            const answer = answerFor(answers, q.id);
            return (
              <DiscoveryQuestionCard
                key={q.id}
                question={q}
                answer={answer}
                needsAnswer={markUnanswered && !isAnswered(q, answer)}
                onChange={(update) => onAnswer(q.id, update)}
              />
            );
          })}
        </fieldset>
        <div className="pager">
          <span className="hint">{canEditAnswers ? "Answers save automatically." : "Answers are read-only at this stage."}</span>
          <div className="pager-actions">
            <button type="button" className="btn" onClick={() => onNavigate(prev.view)}>{prev.label}</button>
            {next && <button type="button" className="btn primary" onClick={() => onNavigate(next.view)}>{next.label}</button>}
            {!next && (showProductNote ? <span className="hint pager-note">{PRODUCT_SUBMIT_NOTE}</span> : submitAction)}
          </div>
        </div>
      </div>
    </>
  );
}
