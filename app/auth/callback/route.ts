import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/auth";

export async function GET(request: Request) {
  const { origin, searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const supabase = await createSupabaseServerClient();

  if (!code) return NextResponse.redirect(new URL("/login?error=callback", origin));
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(new URL("/login?error=callback", origin));

  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase.from("profiles").select("is_superadmin").eq("id", user.id).maybeSingle()
    : { data: null };

  if (!profile?.is_superadmin && !isAdminEmail(user?.email)) {
    await supabase.auth.signOut();
    const url = new URL("/login?error=forbidden", origin);
    if (user?.email) url.searchParams.set("email", user.email);
    return NextResponse.redirect(url);
  }
  return NextResponse.redirect(new URL("/", origin));
}
