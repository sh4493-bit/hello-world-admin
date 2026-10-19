"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { TONES, type Tone } from "@/lib/data";

export async function signOutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export type FormState = { error?: string };

function parse(formData: FormData) {
  const prompt = String(formData.get("prompt") ?? "").trim();
  const caption = String(formData.get("caption") ?? "").trim();
  const tone = String(formData.get("tone") ?? "") as Tone;
  if (prompt.length < 8 || prompt.length > 500) return { error: "Prompt must be 8–500 characters." };
  if (caption.length < 1 || caption.length > 280) return { error: "Caption must be 1–280 characters." };
  if (!TONES.includes(tone)) return { error: "Choose a valid tone." };
  return { prompt, caption, tone };
}

export async function createMediaAction(_: FormState, formData: FormData): Promise<FormState> {
  const { supabase, user } = await requireAdmin();
  const parsed = parse(formData);
  if ("error" in parsed) return parsed;
  const owner = String(formData.get("user_id") ?? "").trim() || user.id;
  if (!UUID.test(owner)) return { error: "Author must be a valid user id." };
  const { error } = await supabase.from("caption_generations").insert({ ...parsed, user_id: owner });
  if (error) return { error: error.message };
  revalidatePath("/media");
  redirect("/media");
}

export async function updateMediaAction(_: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!UUID.test(id)) return { error: "Invalid id." };
  const parsed = parse(formData);
  if ("error" in parsed) return parsed;
  const { error } = await supabase.from("caption_generations").update(parsed).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/media");
  redirect("/media");
}

export async function deleteMediaAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!UUID.test(id)) return;
  await supabase.from("caption_generations").delete().eq("id", id);
  revalidatePath("/media");
  revalidatePath("/");
}
