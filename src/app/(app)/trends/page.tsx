import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { TerminalFrame } from "@/components/terminal-frame";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CircuitFrame } from "@/components/hud/circuit-frame";
import { MicroLabels } from "@/components/hud/micro-labels";
import { MeterBar } from "@/components/hud/data-readout";
import { HudDial } from "@/components/hud/hud-dial";

export const dynamic = "force-dynamic";

interface DnaRow {
  hook_style: string | null;
  emotion: string | null;
  content_territory: string | null;
  format: string | null;
  creative_family: string | null;
  predicted_performance_score: number | null;
  created_at: string;
}

function tally(rows: DnaRow[], key: keyof DnaRow): Map<string, { count: number; avgScore: number }> {
  const m = new Map<string, { count: number; scoreSum: number; scoreN: number }>();
  for (const r of rows) {
    const v = r[key];
    if (typeof v !== "string" || !v) continue;
    const cur = m.get(v) ?? { count: 0, scoreSum: 0, scoreN: 0 };
    cur.count += 1;
    if (typeof r.predicted_performance_score === "number") {
      cur.scoreSum += r.predicted_performance_score;
      cur.scoreN += 1;
    }
    m.set(v, cur);
  }
  const out = new Map<string, { count: number; avgScore: number }>();
  for (const [k, v] of m) {
    out.set(k, { count: v.count, avgScore: v.scoreN ? Math.round(v.scoreSum / v.scoreN) : 0 });
  }
  return out;
}

function sortMap(
  m: Map<string, { count: number; avgScore: number }>,
  by: "count" | "score" = "count"
) {
  return Array.from(m.entries()).sort((a, b) => {
    if (by === "score") return b[1].avgScore - a[1].avgScore;
    return b[1].count - a[1].count;
  });
}

export default async function TrendsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("creative_dna_reports")
    .select(
      "hook_style, emotion, content_territory, format, creative_family, predicted_performance_score, created_at"
    )
    .eq("owner_id", user.id);

  const rows = (data ?? []) as DnaRow[];

  if (rows.length === 0) {
    return (
      <div className="relative p-6 sm:p-8 max-w-5xl mx-auto">
        <PageHeader
          code="MOD.07 :: TREND_RADAR"
          title="TREND RADAR"
          subtitle="What's trending. What's underserved. Where to play."
        />
        <div className="border border-line-100 bg-bg-1/40 p-10 text-center">
          <div className="cret-display text-3xl text-ink-200 mb-2">NO DATA YET</div>
          <p className="text-ink-300 mb-4">
            Analyze at least a few pieces of content to populate the Trend Radar.
          </p>
          <Link href="/analyze">
            <Button variant="primary" size="md">
              ▶ Analyze content
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const hooks = sortMap(tally(rows, "hook_style"));
  const emotions = sortMap(tally(rows, "emotion"));
  const territories = sortMap(tally(rows, "content_territory"));
  const formats = sortMap(tally(rows, "format"));
  const families = sortMap(tally(rows, "creative_family"));

  // "Underserved": low count, high avg score
  const territoriesByScore = sortMap(tally(rows, "content_territory"), "score");
  const underserved = territoriesByScore.filter(([, v]) => v.count <= 2 && v.avgScore >= 70);
  const overcrowded = territories.filter(([, v]) => v.count >= 3);

  const totalAvg = Math.round(
    rows.reduce((a, r) => a + (r.predicted_performance_score ?? 0), 0) / Math.max(1, rows.length)
  );

  return (
    <div className="relative p-6 sm:p-8 max-w-7xl mx-auto">
      <PageHeader
        code="MOD.07 :: TREND_RADAR"
        title="TREND RADAR"
        subtitle="Computed from your saved analyses. The shape of your content landscape."
        right={
          <div className="flex items-center gap-3">
            <MicroLabels count={3} hue="muted" seed={8} className="hidden md:flex" />
            <Badge variant="purple">{rows.length} ASSETS</Badge>
          </div>
        }
      />

      {/* Top row — health snapshot */}
      <div className="grid sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
        <SnapshotTile label="ASSETS" value={rows.length} hue="purple" />
        <SnapshotTile label="AVG SCORE" value={totalAvg} hue={totalAvg >= 70 ? "green" : "red"} />
        <SnapshotTile label="HOOKS" value={hooks.length} hue="blue" />
        <SnapshotTile label="FAMILIES" value={families.length} hue="amber" />
        <SnapshotTile
          label="UNDERSERVED"
          value={underserved.length}
          hue={underserved.length > 0 ? "green" : "purple"}
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        <RankPanel title="trending_hooks" code="TR.01" rows={hooks.slice(0, 8)} />
        <RankPanel title="trending_emotions" code="TR.02" rows={emotions.slice(0, 8)} hue="purple" />
        <RankPanel title="trending_territories" code="TR.03" rows={territories.slice(0, 8)} hue="blue" />
        <RankPanel title="trending_formats" code="TR.04" rows={formats.slice(0, 8)} hue="red" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <OpportunityPanel
          title="underserved_opportunities"
          code="OP.UND"
          hue="green"
          subtitle="// territories with high score but low coverage — make more here"
          rows={underserved.length > 0 ? underserved : territoriesByScore.slice(0, 3)}
          hint={
            underserved.length === 0
              ? "Not enough data to flag clear opportunities yet. Keep analyzing."
              : null
          }
        />
        <OpportunityPanel
          title="overcrowded_territories"
          code="OP.OVR"
          hue="red"
          subtitle="// territories you're already producing a lot in — diminishing returns risk"
          rows={overcrowded.slice(0, 5)}
          hint={overcrowded.length === 0 ? "No overcrowding detected yet." : null}
        />
      </div>
    </div>
  );
}

function SnapshotTile({
  label,
  value,
  hue,
}: {
  label: string;
  value: number | string;
  hue: "green" | "purple" | "blue" | "red" | "amber";
}) {
  const c =
    hue === "green"
      ? "text-neon-green cret-glow-green"
      : hue === "purple"
        ? "text-neon-purple cret-glow-purple"
        : hue === "blue"
          ? "text-neon-blue cret-glow-blue"
          : hue === "amber"
            ? "text-neon-amber"
            : "text-scan-red cret-glow-red";
  return (
    <div className="relative border border-line-100 bg-bg-1/70 p-4 overflow-hidden">
      <CircuitFrame corner="br" hue={hue === "amber" ? "purple" : hue} size={36} />
      <div className="cret-mono text-[10px] uppercase tracking-[0.25em] text-ink-300 mb-2">
        {label}
      </div>
      <div className={`cret-display text-4xl leading-none ${c}`}>{value}</div>
    </div>
  );
}

function RankPanel({
  title,
  code,
  rows,
  hue = "green",
}: {
  title: string;
  code: string;
  rows: Array<[string, { count: number; avgScore: number }]>;
  hue?: "green" | "purple" | "blue" | "red";
}) {
  const max = Math.max(1, ...rows.map(([, v]) => v.count));
  return (
    <TerminalFrame title={title} code={code} status="ONLINE" glow={hue} className="relative overflow-hidden">
      <CircuitFrame corner="br" hue={hue === "red" ? "purple" : "red"} size={40} />
      <div className="p-5 space-y-3">
        {rows.length === 0 ? (
          <div className="text-ink-400 cret-mono text-xs uppercase tracking-[0.2em]">
            no data
          </div>
        ) : (
          rows.map(([k, v]) => (
            <div key={k}>
              <div className="flex justify-between mb-1 cret-mono text-[10px] uppercase tracking-[0.15em]">
                <span className="text-ink-200 truncate">{k}</span>
                <span className="text-ink-300 tabular-nums">
                  {v.count}× · avg {v.avgScore || "—"}
                </span>
              </div>
              <MeterBar value={(v.count / max) * 100} hue={hue} />
            </div>
          ))
        )}
      </div>
    </TerminalFrame>
  );
}

function OpportunityPanel({
  title,
  code,
  hue,
  subtitle,
  rows,
  hint,
}: {
  title: string;
  code: string;
  hue: "green" | "red";
  subtitle: string;
  rows: Array<[string, { count: number; avgScore: number }]>;
  hint: string | null;
}) {
  return (
    <TerminalFrame title={title} code={code} status="ONLINE" glow={hue} className="relative overflow-hidden">
      <CircuitFrame corner="tr" hue={hue} size={40} />
      <div className="p-5">
        <div
          className={
            "cret-mono text-[10px] uppercase tracking-[0.3em] mb-3 " +
            (hue === "green" ? "text-neon-green" : "text-scan-red")
          }
        >
          {subtitle}
        </div>
        {rows.length === 0 || hint ? (
          <div className="text-ink-300 cret-mono text-xs">{hint ?? "no candidates"}</div>
        ) : (
          <ul className="space-y-2">
            {rows.map(([k, v]) => (
              <li
                key={k}
                className="flex items-center justify-between border border-line-100 px-3 py-2"
              >
                <span className="text-ink-100 cret-mono text-sm truncate">{k}</span>
                <div className="flex items-center gap-3">
                  <HudDial size={36} value={v.avgScore || "—"} hue={hue} />
                  <Badge variant="muted">{v.count}×</Badge>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </TerminalFrame>
  );
}
