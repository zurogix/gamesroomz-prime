const RADIUS = 7;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function ProgressRing({ done, total }: { done: number; total: number }) {
  const ratio = total ? done / total : 0;
  return (
    <svg className="ring" width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <circle className="ring-track" cx="9" cy="9" r={RADIUS} fill="none" strokeWidth="2.2" />
      {ratio > 0 && (
        <circle
          className="ring-fill"
          cx="9"
          cy="9"
          r={RADIUS}
          fill="none"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeDasharray={`${CIRCUMFERENCE * ratio} ${CIRCUMFERENCE}`}
          transform="rotate(-90 9 9)"
        />
      )}
    </svg>
  );
}
