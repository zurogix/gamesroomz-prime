import { DiscoverySection } from "@/lib/discoveryTypes";
import SectionTipList from "./SectionTipList";

export default function RailSectionTips({ section }: { section: DiscoverySection }) {
  return (
    <section className="rail-tips" aria-label="About this section">
      <span className="label">About this section</span>
      <SectionTipList section={section} />
    </section>
  );
}
