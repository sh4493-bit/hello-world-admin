import { requireAdmin } from "@/lib/auth";
import { fetchAll, type Media, type Profile, type Vote } from "@/lib/data";
import { computeStats } from "@/lib/stats";
import { ActivityChart, Bars, Heatmap } from "@/components/charts";

export const dynamic = "force-dynamic";
const pct = (n: number | null) => (n === null ? "—" : `${Math.round(n * 100)}%`);

export default async function Dashboard() {
  const { supabase } = await requireAdmin();
  const [profiles, media, votes] = await Promise.all([
    fetchAll<Profile>(supabase, "profiles", "*"),
    fetchAll<Media>(supabase, "caption_generations", "*"),
    fetchAll<Vote>(supabase, "caption_votes", "*"),
  ]);
  const s = computeStats(profiles, media, votes);
  const t = s.totals;
  const bestTone = [...s.tones].filter((x) => x.approval !== null).sort((a, b) => b.approval! - a.approval!)[0];
  const bestLen = [...s.lengths].filter((x) => x.approval !== null).sort((a, b) => b.approval! - a.approval!)[0];

  return (
    <>
      <p className="eyebrow">Overview</p>
      <h1>The city, by the numbers</h1>
      <p className="muted">Live from the database. Times are UTC.</p>

      <div className="grid g4">
        {[
          ["Members", t.users, `${t.admins} admin${t.admins === 1 ? "" : "s"}`],
          ["AI captions", t.media, `${t.creators} creators · ${t.unrated} unrated`],
          ["Ratings cast", t.votes, `${t.voters} voters · ${t.avgVotes.toFixed(1)} per caption`],
          ["Approval", pct(t.approval), `${t.ups} up · ${t.downs} down`],
        ].map(([l, v, sub]) => (
          <div className="card kpi" key={String(l)}><div className="l">{l}</div><div className="v">{v}</div><div className="s">{sub}</div></div>
        ))}
      </div>

      <div className="grid g2">
        <section className="card">
          <h2>Last 30 days</h2>
          <div className="legend"><span><i className="dot" style={{ background: "var(--s1)" }} />Ratings</span><span><i className="dot" style={{ background: "var(--s2)" }} />Captions</span></div>
          <ActivityChart days={s.days} />
        </section>
        <section className="card">
          <h2>When do people vote?</h2>
          <p className="insight">Weekday × hour, darker = more ratings.</p>
          <Heatmap heat={s.heat} />
        </section>
        <section className="card">
          <h2>Which tone wins?</h2>
          <p className="insight">{bestTone ? `${bestTone.tone} captions are approved most often (${pct(bestTone.approval)}).` : "No ratings yet."}</p>
          <Bars rows={s.tones.map((x) => ({ label: x.tone, value: x.approval, text: `${pct(x.approval)} · ${x.captions}`, tone: x.tone }))} />
        </section>
        <section className="card">
          <h2>Does brevity win?</h2>
          <p className="insight">{bestLen ? `Captions of ${bestLen.label} characters score best (${pct(bestLen.approval)}).` : "No ratings yet."}</p>
          <Bars rows={s.lengths.map((x) => ({ label: `${x.label} chars`, value: x.approval, text: `${pct(x.approval)} · ${x.captions}` }))} />
        </section>
        <section className="card">
          <h2>Hall of fame</h2>
          <ul className="rows">{s.top.map((c) => <li key={c.id}><span className="t">“{c.caption}” <span className="muted">— {c.author}</span></span><span className="n">{c.net > 0 ? "+" : ""}{c.net}</span></li>)}</ul>
          {!s.top.length && <p className="muted">Nothing rated yet.</p>}
        </section>
        <section className="card">
          <h2>Most divisive</h2>
          <p className="insight">Closest to a 50/50 split (2+ ratings).</p>
          <ul className="rows">{s.controversial.map((c) => <li key={c.id}><span className="t">“{c.caption}”</span><span className="n">{c.up}↑ {c.down}↓</span></li>)}</ul>
          {!s.controversial.length && <p className="muted">No divisive captions yet.</p>}
        </section>
        <section className="card">
          <h2>Top creators</h2>
          <ul className="rows">{s.creators.map((c) => <li key={c.id}><span className="t">{c.name}</span><span className="n">{c.captions} captions · net {c.net}</span></li>)}</ul>
        </section>
        <section className="card">
          <h2>Words the AI loves</h2>
          <p className="insight">Most frequent words across all captions.</p>
          <Bars rows={s.topWords.map(([w, n]) => ({ label: w, value: n / (s.topWords[0]?.[1] || 1), text: String(n) }))} />
        </section>
      </div>
    </>
  );
}
