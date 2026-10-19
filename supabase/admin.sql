-- Admin area migration. Run once in the Supabase SQL editor (shared database).

-- 1. The flag. Defaults to false for everyone.
alter table public.profiles
  add column if not exists is_superadmin boolean not null default false;

-- 2. Stop users from promoting themselves. The existing "update own profile"
--    policy would otherwise let anyone PATCH is_superadmin = true.
revoke insert, update on table public.profiles from authenticated;
grant insert (id, first_name, last_name, avatar_url) on table public.profiles to authenticated;
grant update (first_name, last_name, avatar_url, updated_at) on table public.profiles to authenticated;

-- 3. Helper used by RLS. security definer so it can read profiles without recursion.
create or replace function public.is_superadmin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select is_superadmin from public.profiles where id = (select auth.uid())), false);
$$;
revoke all on function public.is_superadmin() from public, anon;
grant execute on function public.is_superadmin() to authenticated;

-- 4. Admin policies (additive to the existing per-user policies).
drop policy if exists "Admins read all profiles" on public.profiles;
create policy "Admins read all profiles" on public.profiles
  for select to authenticated using (public.is_superadmin());

grant select, update, delete on public.caption_generations to authenticated;
grant select on public.caption_votes to authenticated;

drop policy if exists "Admins read all captions" on public.caption_generations;
create policy "Admins read all captions" on public.caption_generations
  for select to authenticated using (public.is_superadmin());
drop policy if exists "Admins insert captions" on public.caption_generations;
create policy "Admins insert captions" on public.caption_generations
  for insert to authenticated with check (public.is_superadmin());
drop policy if exists "Admins update captions" on public.caption_generations;
create policy "Admins update captions" on public.caption_generations
  for update to authenticated using (public.is_superadmin()) with check (public.is_superadmin());
drop policy if exists "Admins delete captions" on public.caption_generations;
create policy "Admins delete captions" on public.caption_generations
  for delete to authenticated using (public.is_superadmin());

drop policy if exists "Admins read all votes" on public.caption_votes;
create policy "Admins read all votes" on public.caption_votes
  for select to authenticated using (public.is_superadmin());

-- 5. Bootstrap (solves the lock-out): after signing in with Google once so your
--    profile row exists, promote yourself from the SQL editor (runs as the
--    postgres owner, which bypasses RLS and the column grants above):
--
--    update public.profiles set is_superadmin = true
--    where id = (select id from auth.users where email = 'YOU@example.com');
