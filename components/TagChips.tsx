import { Tag } from "@/lib/discoveryTypes";

export default function TagChips({ tags }: { tags: Tag[] }) {
  if (tags.length === 0) return null;
  return (
    <span className="tags" aria-label="Tags">
      {tags.map((t) => <span key={t} className={`tag tag-${t.toLowerCase()}`}>{t}</span>)}
    </span>
  );
}
