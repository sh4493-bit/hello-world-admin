import "server-only";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Hardcoded admins, matched case-insensitively against the verified Google
// email. Keep in sync with public.is_superadmin() in supabase/admin.sql.
export const ADMIN_EMAILS = ["ni2302@columbia.edu", "sh4493@barnard.edu"];

export function isAdminEmail(email: string | null | undefined) {
  return !!email && ADMIN_EMAILS.includes(email.toLowerCase());
}

/**
 * The real authorization gate. Call it at the top of every admin page and
 * every server action (layouts don't re-run on client navigation, and actions
 * are public POST endpoints). Authorization comes from profiles.is_superadmin,
 * and RLS independently enforces the same rule in the database.
 */
export async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, is_superadmin")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.is_superadmin && !isAdminEmail(user.email)) {
    await supabase.auth.signOut();
    redirect("/login?error=forbidden");
  }
  return { supabase, user, profile };
}
