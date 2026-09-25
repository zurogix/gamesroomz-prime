export type ProgressLine = { label: string; percent: number; detail?: string };

/** Labelled progress bars, e.g. "This section · 2 of 3 answered" and overall discovery. */
export default function RailProgress({ lines }: { lines: ProgressLine[] }) {
  return (
    <section>
      <span className="label">Progress</span>
      {lines.map((line) => (
        <div key={line.label} className="rail-progress-item">
          <div className="progress-line">
            <span>{line.label}</span>
            <span className="num">{line.detail ?? `${line.percent}%`}</span>
          </div>
          <div className="bar"><i style={{ width: `${line.percent}%` }} /></div>
        </div>
      ))}
    </section>
  );
}
