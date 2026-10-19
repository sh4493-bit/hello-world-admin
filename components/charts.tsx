import type { Stats } from "@/lib/stats";

const W = 560, H = 160, P = { l: 28, r: 8, t: 8, b: 20 };

/** 30-day activity: captions vs votes on ONE shared axis. */
export function ActivityChart({ days }: { days: Stats["days"] }) {
  const max = Math.max(1, ...days.map((d) => Math.max(d.captions, d.votes)));
  const x = (i: number) => P.l + (i / (days.length - 1)) * (W - P.l - P.r);
  const y = (v: number) => H - P.b - (v / max) * (H - P.t - P.b);
  const line = (k: "captions" | "votes") => days.map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(d[k]).toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Captions and votes per day, last 30 days" width="100%">
      {[0, 0.5, 1].map((f) => (
        <g key={f}>
          <line x1={P.l} x2={W - P.r} y1={y(max * f)} y2={y(max * f)} stroke="var(--line)" />
          <text x={P.l - 6} y={y(max * f) + 4} textAnchor="end">{Math.round(max * f)}</text>
        </g>
      ))}
      <path d={line("votes")} fill="none" stroke="var(--s1)" strokeWidth="2" strokeLinejoin="round" />
      <path d={line("captions")} fill="none" stroke="var(--s2)" strokeWidth="2" strokeLinejoin="round" />
      {days.map((d, i) => (
        <rect key={d.date} x={x(i) - 8} y={P.t} width="16" height={H - P.t - P.b} fill="transparent">
          <title>{`${d.date}: ${d.captions} captions, ${d.votes} votes`}</title>
        </rect>
      ))}
      <text x={P.l} y={H - 4}>{days[0].date.slice(5)}</text>
      <text x={W - P.r} y={H - 4} textAnchor="end">{days[days.length - 1].date.slice(5)}</text>
    </svg>
  );
}

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Weekday × hour voting heatmap, single-hue sequential. */
export function Heatmap({ heat }: { heat: number[][] }) {
  const max = Math.max(1, ...heat.flat());
  const cw = 20, ch = 18, ox = 34;
  return (
    <svg viewBox={`0 0 ${ox + cw * 24} ${ch * 7 + 20}`} role="img" aria-label="Votes by weekday and hour (UTC)" width="100%">
      {heat.map((row, d) => (
        <g key={d}>
          <text x={0} y={d * ch + 13}>{DOW[d]}</text>
          {row.map((n, h) => (
            <rect key={h} x={ox + h * cw} y={d * ch} width={cw - 2} height={ch - 2} rx="3"
              fill="var(--heat1)" fillOpacity={n ? 0.15 + 0.85 * (n / max) : 0.06}>
              <title>{`${DOW[d]} ${String(h).padStart(2, "0")}:00 UTC — ${n} vote${n === 1 ? "" : "s"}`}</title>
            </rect>
          ))}
        </g>
      ))}
      {[0, 6, 12, 18].map((h) => <text key={h} x={ox + h * cw} y={ch * 7 + 14}>{String(h).padStart(2, "0")}h</text>)}
    </svg>
  );
}

const TONE_COLOR: Record<string, string> = { witty: "var(--s1)", wholesome: "var(--s2)", deadpan: "var(--s3)", dramatic: "var(--s4)" };

/** Horizontal bars; value labelled directly. */
export function Bars({ rows }: { rows: { label: string; value: number | null; text: string; tone?: string }[] }) {
  return (
    <div>
      {rows.map((r) => (
        <div className="bar" key={r.label} title={`${r.label}: ${r.text}`}>
          <span>{r.label}</span>
          <span className="track"><span className="fill" style={{ width: `${Math.max(0, (r.value ?? 0)) * 100}%`, background: r.tone ? TONE_COLOR[r.tone] : "var(--s1)" }} /></span>
          <span style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{r.text}</span>
        </div>
      ))}
    </div>
  );
}
