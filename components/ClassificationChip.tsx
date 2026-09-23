import { CLASS_LABEL } from "@/lib/sections";
import { Classification } from "@/lib/types";

export default function ClassificationChip({ value }: { value: Classification }) {
  if (!value) return <span className="chip chip-none">Unclassified</span>;
  return <span className={`chip chip-${value}`}>{CLASS_LABEL[value]}</span>;
}
