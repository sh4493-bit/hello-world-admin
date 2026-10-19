import { requireAdmin } from "@/lib/auth";
import { displayName, type Profile } from "@/lib/data";

export const dynamic = "force-dynamic";
const PAGE = 25;

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const { supabase } = await requireAdmin();
  const { q = "", page = "1" } = await searchParams;
  const p = Math.max(1, Number(page) || 1);

  let query = supabase.from("profiles").select("*", { count: "exact" }).order("created_at", { ascending: false }).range((p - 1) * PAGE, p * PAGE - 1);
  const term = q.replace(/[%,()]/g, " ").trim();
  if (term) query = query.or(`first_name.ilike.%${term}%,last_name.ilike.%${term}%`);
  const { data, count, error } = await query;
  const rows = (data ?? []) as Profile[];
  const ids = rows.map((r) => r.id);
  const [caps, vts] = ids.length ? await Promise.all([
    supabase.from("caption_generations").select("user_id").in("user_id", ids),
    supabase.from("caption_votes").select("user_id").in("user_id", ids),
  ]) : [{ data: [] }, { data: [] }];
  const count_ = (list: { user_id: string }[] | null) => { const m = new Map<string, number>(); (list ?? []).forEach((x) => m.set(x.user_id, (m.get(x.user_id) ?? 0) + 1)); return m; };
  const capN = count_(caps.data), voteN = count_(vts.data);
  const pages = Math.max(1, Math.ceil((count ?? 0) / PAGE));

  return (
    <>
      <h1>Users</h1>
      <p className="muted">{count ?? 0} profiles · read-only</p>
      <form className="toolbar"><input name="q" placeholder="Search name…" defaultValue={q} /><button className="btn">Search</button></form>
      {error && <p className="alert">{error.message}</p>}
      <div className="card table-wrap">
        <table>
          <thead><tr><th>Name</th><th>ID</th><th>Role</th><th>Captions</th><th>Ratings given</th><th>Joined</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{displayName(r)}</td><td className="muted">{r.id.slice(0, 8)}</td>
                <td>{r.is_superadmin ? <span className="pill admin">admin</span> : <span className="pill">member</span>}</td>
                <td>{capN.get(r.id) ?? 0}</td><td>{voteN.get(r.id) ?? 0}</td>
                <td className="muted">{r.created_at.slice(0, 10)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pager base="/users" q={q} page={p} pages={pages} />
    </>
  );
}

function Pager({ base, q, page, pages, extra = "" }: { base: string; q: string; page: number; pages: number; extra?: string }) {
  const href = (n: number) => `${base}?page=${n}&q=${encodeURIComponent(q)}${extra}`;
  return (
    <div className="pager">
      {page > 1 && <a className="btn" href={href(page - 1)}>← Prev</a>}
      <span className="muted">Page {page} of {pages}</span>
      {page < pages && <a className="btn" href={href(page + 1)}>Next →</a>}
    </div>
  );
}
