import { SaveStatus } from "./SaveStatusContext";

function savedLabel(savedAt: number | null, now: number) {
  if (!savedAt) return "All changes saved";
  const seconds = Math.max(0, Math.round((now - savedAt) / 1000));
  if (seconds < 5) return "Saved just now";
  if (seconds < 60) return `Saved ${seconds}s ago`;
  return `Saved ${Math.round(seconds / 60)} min ago`;
}

export default function SaveStatusLabel({ status, now }: { status: SaveStatus; now: number }) {
  if (status.state === "saving") return <>Saving…</>;
  if (status.state === "conflict") return <>Not saved</>;
  if (status.state === "error") {
    return (
      <>
        Save failed — <button type="button" className="link-btn" onClick={status.retry}>Retry</button>
      </>
    );
  }
  return <>{savedLabel(status.savedAt, now)}</>;
}
