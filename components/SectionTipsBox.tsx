import { DiscoverySection } from "@/lib/discoveryTypes";
import SectionTipList from "./SectionTipList";

/** Shown at the top of a section on screens where the rail is not beside the form. */
export default function SectionTipsBox({ section }: { section: DiscoverySection }) {
  return (
    <details className="tips-box">
      <summary>About this section</summary>
      <SectionTipList section={section} />
    </details>
  );
}
