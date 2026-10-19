import type { Media, Profile, Vote, Tone } from "@/lib/data";
import { TONES, displayName } from "@/lib/data";

const STOP = new Set("the a an and or of to in on at for with is it its this that my your our i you we he she they be are was were as by from but not so if than then just more most very can will into out up over all one when what how new york city nyc".split(" "));

export type Scored = Media & { up: number; down: number; net: number; total: number; author: string };

export function computeStats(profiles: Profile[], media: Media[], votes: Vote[]) {
  const byProfile = new Map(profiles.map((p) => [p.id, p]));
  const tally = new Map<string, { up: number; down: number }>();
  for (const v of votes) {
    const t = tally.get(v.generation_id) ?? { up: 0, down: 0 };
    t[v.value]++;
    tally.set(v.generation_id, t);
  }
  const scored: Scored[] = media.map((m) => {
    const t = tally.get(m.id) ?? { up: 0, down: 0 };
    return { ...m, ...t, net: t.up - t.down, total: t.up + t.down, author: displayName(byProfile.get(m.user_id)) };
  });

  const ups = votes.filter((v) => v.value === "up").length;
  const rated = scored.filter((s) => s.total > 0);

  // Daily activity, last 30 days (UTC).
  const days: { date: string; captions: number; votes: number }[] = [];
  const idx = new Map<string, number>();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 864e5).toISOString().slice(0, 10);
    idx.set(d, days.length);
    days.push({ date: d, captions: 0, votes: 0 });
  }
  for (const m of media) { const i = idx.get(m.created_at.slice(0, 10)); if (i !== undefined) days[i].captions++; }
  for (const v of votes) { const i = idx.get(v.created_at.slice(0, 10)); if (i !== undefined) days[i].votes++; }

  // Weekday x hour heatmap of votes (UTC).
  const heat = Array.from({ length: 7 }, () => Array<number>(24).fill(0));
  for (const v of votes) { const d = new Date(v.created_at); heat[d.getUTCDay()][d.getUTCHours()]++; }

  const tones = TONES.map((tone) => {
    const items = scored.filter((s) => s.tone === tone);
    const u = items.reduce((n, s) => n + s.up, 0);
    const d = items.reduce((n, s) => n + s.down, 0);
    return { tone, captions: items.length, up: u, down: d, approval: u + d ? u / (u + d) : null };
  });

  const buckets = [
    { label: "< 60", test: (n: number) => n < 60 }, { label: "60–99", test: (n: number) => n < 100 },
    { label: "100–159", test: (n: number) => n < 160 }, { label: "160+", test: () => true },
  ];
  const lengths = buckets.map((b, i) => {
    const items = scored.filter((s) => {
      const n = s.caption.length;
      return b.test(n) && (i === 0 || !buckets[i - 1].test(n));
    });
    const u = items.reduce((n, s) => n + s.up, 0);
    const d = items.reduce((n, s) => n + s.down, 0);
    return { label: b.label, captions: items.length, approval: u + d ? u / (u + d) : null, votes: u + d };
  });

  const words = new Map<string, number>();
  for (const m of media)
    for (const w of m.caption.toLowerCase().match(/[a-z']{4,}/g) ?? [])
      if (!STOP.has(w)) words.set(w, (words.get(w) ?? 0) + 1);

  const creators = new Map<string, { id: string; name: string; captions: number; net: number }>();
  for (const s of scored) {
    const c = creators.get(s.user_id) ?? { id: s.user_id, name: s.author, captions: 0, net: 0 };
    c.captions++; c.net += s.net; creators.set(s.user_id, c);
  }

  const controversial = rated.filter((s) => s.total >= 2)
    .sort((a, b) => Math.min(b.up, b.down) / b.total - Math.min(a.up, a.down) / a.total || b.total - a.total)
    .slice(0, 5);

  return {
    totals: {
      users: profiles.length, admins: profiles.filter((p) => p.is_superadmin).length,
      media: media.length, votes: votes.length, ups, downs: votes.length - ups,
      approval: votes.length ? ups / votes.length : null,
      unrated: media.length - rated.length,
      voters: new Set(votes.map((v) => v.user_id)).size,
      creators: new Set(media.map((m) => m.user_id)).size,
      avgVotes: media.length ? votes.length / media.length : 0,
    },
    days, heat, tones, lengths,
    topWords: [...words.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10),
    top: [...rated].sort((a, b) => b.net - a.net || b.total - a.total).slice(0, 5),
    controversial,
    creators: [...creators.values()].sort((a, b) => b.captions - a.captions || b.net - a.net).slice(0, 5),
  };
}
export type Stats = ReturnType<typeof computeStats>;
export type { Tone };
