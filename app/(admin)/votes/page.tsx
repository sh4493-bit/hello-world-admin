import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { displayName, type Media, type Profile, type Vote } from "@/lib/data";

export const dynamic = "force-dynamic";
const PAGE = 30;

export default async function VotesPage({ searchParams }: { searchParams: Promise<{ value?: string; page?: string }> }) {
  const { supabase } = await requireAdmin();
  const { value = "", page = "1" } = await searchParams;
  const p = Math.max(1, Number(page) || 1);

  let query = supabase.from("caption_votes").select("*", { count: "exact" }).order("created_at", { ascending: false }).range((p - 1) * PAGE, p * PAGE - 1);
  if (value === "up" || value === "down") query = query.eq("value", value);
  const { data, count, error } = await query;
  const rows = (data ?? []) as Vote[];

  const capIds = [...new Set(rows.map((r) => r.generation_id))];
  const userIds = [...new Set(rows.map((r) => r.user_id))];
  const [caps, users] = await Promise.all([
    capIds.length ? supabase.from("caption_generations").select("id, caption").in("id", capIds) : { data: [] },
    userIds.length ? supabase.from("profiles").select("*").in("id", userIds) : { data: [] },
  ]);
  const capMap = new Map(((caps.data ?? []) as Pick<Media, "id" | "caption">[]).map((c) => [c.id, c.caption]));
  const userMap = new Map(((users.data ?? []) as Profile[]).map((u) => [u.id, displayName(u)]));
  const pages = Math.max(1, Math.ceil((count ?? 0) / PAGE));
  const link = (n: number) => `/votes?page=${n}&value=${value}`;

  return (
    <>
      <h1>Ratings</h1>
      <p className="muted">{count ?? 0} votes · read-only</p>
      <form className="toolbar">
        <select name="value" defaultValue={value}><option value="">Up and down</option><option value="up">Upvotes</option><option value="down">Downvotes</option></select>
        <button className="btn">Filter</button>
      </form>
      {error && <p className="alert">{error.message}</p>}
      <div className="card table-wrap">
        <table>
          <thead><tr><th>Rating</th><th>Caption</th><th>Voter</th><th>When</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td><span className="pill" style={{ color: r.value === "up" ? "var(--s1)" : "var(--s2)" }}>{r.value === "up" ? "▲ up" : "▼ down"}</span></td>
                <td>{capMap.get(r.generation_id) ?? <span className="muted">(deleted)</span>}</td>
                <td>{userMap.get(r.user_id) ?? r.user_id.slice(0, 8)}</td>
                <td className="muted">{r.created_at.replace("T", " ").slice(0, 16)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="pager">
        {p > 1 && <Link className="btn" href={link(p - 1)}>← Prev</Link>}
        <span className="muted">Page {p} of {pages}</span>
        {p < pages && <Link className="btn" href={link(p + 1)}>Next →</Link>}
      </div>
    </>
  );
}
