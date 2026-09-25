"use client";

import { useState } from "react";
import { clearPortalData } from "@/lib/browserData";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function SignOutButton({ className = "btn quiet" }: { className?: string }) {
  const [busy, setBusy] = useState(false);

  async function signOut() {
    setBusy(true);
    try {
      clearPortalData(localStorage);
    } catch {
      // Storage unavailable: nothing was kept in this browser.
    }
    try {
      await createSupabaseBrowserClient().auth.signOut();
    } finally {
      window.location.assign("/login");
    }
  }

  return (
    <button type="button" className={className} onClick={signOut} disabled={busy}>
      {busy ? "Signing out…" : "Sign out"}
    </button>
  );
}
