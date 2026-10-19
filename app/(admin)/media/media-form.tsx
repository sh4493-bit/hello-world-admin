"use client";

import { useActionState } from "react";
import { TONES, type Media } from "@/lib/data";
import type { FormState } from "../actions";

export default function MediaForm({ action, initial }: {
  action: (s: FormState, f: FormData) => Promise<FormState>; initial?: Media;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form className="form" action={formAction}>
      {initial && <input type="hidden" name="id" value={initial.id} />}
      <label>Prompt<textarea name="prompt" defaultValue={initial?.prompt} minLength={8} maxLength={500} required /></label>
      <label>Caption<textarea name="caption" defaultValue={initial?.caption} maxLength={280} required /></label>
      <label>Tone
        <select name="tone" defaultValue={initial?.tone ?? "witty"}>{TONES.map((t) => <option key={t}>{t}</option>)}</select>
      </label>
      {!initial && <label>Author user id <span className="muted">(optional, defaults to you)</span><input name="user_id" placeholder="uuid" /></label>}
      {state.error && <p className="alert" role="alert">{state.error}</p>}
      <div><button className="btn primary" disabled={pending}>{pending ? "Saving…" : "Save"}</button>{" "}<a className="btn" href="/media">Cancel</a></div>
    </form>
  );
}
