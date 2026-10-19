"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function GoogleButton() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function signIn() {
    setBusy(true);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) { setMessage(error.message); setBusy(false); }
  }

  return (
    <>
      <button className="btn primary wide" onClick={signIn} disabled={busy}>
        {busy ? "Redirecting…" : "Continue with Google"}
      </button>
      {message && <p className="alert" role="alert">{message}</p>}
    </>
  );
}
