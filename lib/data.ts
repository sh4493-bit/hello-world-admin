import type { SupabaseClient } from "@supabase/supabase-js";

export type Tone = "witty" | "wholesome" | "deadpan" | "dramatic";
export const TONES: Tone[] = ["witty", "wholesome", "deadpan", "dramatic"];

export type Profile = {
  id: string; first_name: string | null; last_name: string | null;
  avatar_url: string | null; is_superadmin: boolean; created_at: string; updated_at: string;
};
export type Media = {
  id: string; user_id: string; prompt: string; caption: string; tone: Tone; created_at: string;
};
export type Vote = {
  id: string; generation_id: string; user_id: string; value: "up" | "down"; created_at: string;
};

/** Page through a table; PostgREST caps a single response at 1000 rows. */
export async function fetchAll<T>(
  supabase: SupabaseClient, table: string, columns: string, order = "created_at",
): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase.from(table).select(columns)
      .order(order, { ascending: false }).range(from, from + 999);
    if (error) throw new Error(`${table}: ${error.message}`);
    rows.push(...((data ?? []) as T[]));
    if (!data || data.length < 1000) break;
  }
  return rows;
}

export const displayName = (p?: Pick<Profile, "first_name" | "last_name" | "id"> | null) =>
  p ? [p.first_name, p.last_name].filter(Boolean).join(" ") || `User ${p.id.slice(0, 8)}` : "Unknown user";
