# Color Field Admin

Admin console (Next.js + Supabase) for the Color Field caption app. Google sign-in only; access requires `profiles.is_superadmin = true`.

## Setup
1. Run `supabase/admin.sql` in the Supabase SQL editor (adds the flag, locks it against self-promotion, adds admin RLS policies).
2. Enable the Google provider in Supabase and add this app's URL (`https://<domain>/auth/callback`) to the redirect allow-list.
3. Sign in once with Google, then promote yourself with the `update` statement at the bottom of `admin.sql`.
4. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (see `.env.example`).

## Security model
- `proxy.ts`: optimistic redirect for anonymous visitors.
- `lib/auth.ts` `requireAdmin()`: authoritative check in the admin layout, every page, and every server action.
- Row Level Security: admin policies keyed on `is_superadmin()`, so even a leaked anon key can't read other users' data. No service-role key is used.
