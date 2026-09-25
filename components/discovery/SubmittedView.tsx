import { SUBMITTED_TEXT, SUBMITTED_TITLE } from "@/lib/stages";

type Props = {
  submittedAt: string | null;
  onOverview: () => void;
  /** Opens section A, read-only now that the answers are submitted. */
  onViewAnswers: () => void;
};

const formatDateTime = (iso: string) => new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

/** Shown to a developer once, right after they submit discovery. */
export default function SubmittedView({ submittedAt, onOverview, onViewAnswers }: Props) {
  return (
    <div className="content submitted-view">
      <section className="card submitted-card" role="status">
        <h1>{SUBMITTED_TITLE}</h1>
        <p>{SUBMITTED_TEXT}</p>
        {submittedAt && <p className="hint">Submitted on {formatDateTime(submittedAt)}.</p>}
        <div className="pager-actions">
          <button type="button" className="btn primary" onClick={onOverview}>Back to overview</button>
          <button type="button" className="link-btn" onClick={onViewAnswers}>View your answers</button>
        </div>
      </section>
    </div>
  );
}
