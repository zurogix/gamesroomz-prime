type Props = { onDismiss: () => void };

export default function MigrationNotice({ onDismiss }: Props) {
  return (
    <div className="migration-notice" role="status">
      <span>The assessment was updated to a new discovery format. Previous Yes/No answers were not carried over; plan items marked Modify need to be re-classified.</span>
      <button type="button" className="btn" onClick={onDismiss}>Dismiss</button>
    </div>
  );
}
