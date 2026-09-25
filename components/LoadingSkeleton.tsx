const CONTENT_BLOCKS = ["tall", "short", "tall"];
const NAV_ITEMS = 8;

/** Shown instantly while a page's data loads: sidebar plus content blocks in theme colours. */
export default function LoadingSkeleton() {
  return (
    <div className="skeleton-shell" role="status" aria-live="polite">
      <span className="sr-only">Loading…</span>
      <aside className="skeleton-side" aria-hidden="true">
        <div className="skeleton-bar skeleton-brand" />
        {Array.from({ length: NAV_ITEMS }, (_, i) => <div key={i} className="skeleton-bar skeleton-nav" />)}
      </aside>
      <main className="skeleton-main" aria-hidden="true">
        <div className="skeleton-bar skeleton-title" />
        {CONTENT_BLOCKS.map((size, i) => <div key={i} className={`skeleton-block skeleton-${size}`} />)}
      </main>
    </div>
  );
}
