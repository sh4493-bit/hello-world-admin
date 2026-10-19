import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { TONES, displayName, type Media, type Profile } from "@/lib/data";
import { deleteMediaAction } from "../actions";
import ConfirmButton from "./confirm-button";

export const dynamic = "force-dynamic";
const PAGE = 20;

export default async function MediaPage({ searchParams }: { searchParams: Promise<{ q?: string; tone?: string; page?: string }> }) {
  const { supabase } = await requireAdmin();
  const { q = "", tone = "", page = "1" } = await searchParams;
  const p = Math.max(1, Number(page) || 1);

  let query = supabase.from("caption_generations").select("*", { count: "exact" }).order("created_at", { ascending: false }).range((p - 1) * PAGE, p * PAGE - 1);
  const term = q.replace(/[%,()]/g, " ").trim();
  if (term) query = query.or(`caption.ilike.%${term}%,prompt.ilike.%${term}%`);
  if ((TONES as string[]).includes(tone)) query = query.eq("tone", tone);
  const { data, count, error } = await query;
  const rows = (data ?? []) as Media[];

  const ids = [...new Set(rows.map((r) => r.user_id))];
  const { data: authors } = ids.length ? await supabase.from("profiles").select("*").in("id", ids) : { data: [] };
  const names = new Map(((authors ?? []) as Profile[]).map((a) => [a.id, displayName(a)]));
  const pages = Math.max(1, Math.ceil((count ?? 0) / PAGE));
  const link = (n: number) => `/media?page=${n}&q=${encodeURIComponent(q)}&tone=${tone}`;

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", gap: 12, flexWrap: "wrap" }}>
        <div><h1>AI media</h1><p className="muted">{count ?? 0} generated captions</p></div>
        <Link className="btn primary" href="/media/new">+ New</Link>
      </div>
      <form className="toolbar">
        <input name="q" placeholder="Search captions or prompts…" defaultValue={q} />
        <select name="tone" defaultValue={tone}><option value="">All tones</option>{TONES.map((t) => <option key={t}>{t}</option>)}</select>
        <button className="btn">Filter</button>
      </form>
      {error && <p className="alert">{error.message}</p>}
      <div className="card table-wrap">
        <table>
          <thead><tr><th>Caption</th><th>Prompt</th><th>Tone</th><th>Author</th><th>Created</th><th /></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td style={{ minWidth: 220 }}>{r.caption}</td>
                <td className="muted" style={{ minWidth: 200 }}>{r.prompt}</td>
                <td><span className="pill">{r.tone}</span></td>
                <td>{names.get(r.user_id) ?? r.user_id.slice(0, 8)}</td>
                <td className="muted">{r.created_at.slice(0, 10)}</td>
                <td style={{ whiteSpace: "nowrap" }}>
                  <Link className="btn" href={`/media/${r.id}`}>Edit</Link>{" "}
                  <form action={deleteMediaAction} style={{ display: "inline" }}>
                    <input type="hidden" name="id" value={r.id} />
                    <ConfirmButton message="Delete this caption and its ratings?">Delete</ConfirmButton>
                  </form>
                </td>
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
