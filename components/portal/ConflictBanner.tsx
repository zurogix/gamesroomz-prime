export default function ConflictBanner() {
  return (
    <div className="conflict-banner" role="alert">
      <span>Someone else saved changes. Reload to see the latest version.</span>
      <button type="button" className="btn primary" onClick={() => window.location.reload()}>Reload</button>
    </div>
  );
}
