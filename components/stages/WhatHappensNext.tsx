import { WHAT_HAPPENS_NEXT } from "@/lib/stages";

/** Shown to developers after they submit discovery. */
export default function WhatHappensNext() {
  return (
    <section className="next-note" role="status">
      <b>What happens next</b>
      <p>{WHAT_HAPPENS_NEXT}</p>
    </section>
  );
}
