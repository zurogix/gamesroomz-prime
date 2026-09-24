type Props = { onDismiss: () => void };

export default function MigrationNotice({ onDismiss }: Props) {
  return (
    <div className="migration-notice" role="status">
      <span>Labels were updated. Items previously marked Modify need to be re-classified.</span>
      <button type="button" className="btn" onClick={onDismiss}>Dismiss</button>
    </div>
  );
}
