import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { TerminalFrame } from "@/components/terminal-frame";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HudDial } from "@/components/hud/hud-dial";
import { WireframeOrb } from "@/components/hud/wireframe-orb";
import { HexGrid } from "@/components/hud/hex-grid";
import { CircuitFrame } from "@/components/hud/circuit-frame";
import { MicroLabels } from "@/components/hud/micro-labels";
import { SliderRack } from "@/components/hud/slider-rack";
import { MeterBar } from "@/components/hud/data-readout";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Parallel counts + activity feed
  const [
    { count: assetCount },
    { count: competitorCount },
    { count: creatorCount },
    { count: clusterCount },
    { count: dnaCount },
    { data: recentAssets },
    { data: scoreRow },
  ] = await Promise.all([
    supabase
      .from("content_assets")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", user.id),
    supabase
      .from("competitors")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", user.id),
    supabase
      .from("creators")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", user.id),
    supabase
      .from("creative_clusters")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", user.id),
    supabase
      .from("creative_dna_reports")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", user.id),
    supabase
      .from("content_assets")
      .select(
        `id, title, platform, content_type, creator_name, competitor_name, created_at, thumbnail_url,
         dna:creative_dna_reports(predicted_performance_score, creative_family, emotion, hook_style)`
      )
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("creative_dna_reports")
      .select("predicted_performance_score")
      .eq("owner_id", user.id),
  ]);

  const scores = ((scoreRow ?? []) as Array<{ predicted_performance_score: number | null }>)
    .map((s) => s.predicted_performance_score)
    .filter((s): s is number => typeof s === "number");
  const avgScore =
    scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : null;

  return (
    <div className="relative p-6 sm:p-8 max-w-7xl mx-auto">
      <HexGrid className="inset-0" opacity={0.08} hue="red" />

      <PageHeader
        code="MOD.00 :: COMMAND_CENTER"
        title="DASHBOARD"
        subtitle="Live state of your creative intelligence operations."
        right={
          <div className="flex items-center gap-3">
            <MicroLabels count={3} hue="muted" seed={5} className="hidden md:flex" />
            <Link href="/analyze">
              <Button variant="primary" size="lg">
                ▶ Analyze Content
              </Button>
            </Link>
          </div>
        }
      />

      {/* HUD stat row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        <StatHudTile
          label="CONTENT ANALYZED"
          code="ST.01"
          value={assetCount ?? 0}
          hint="ALL TIME"
          hue="red"
        />
        <StatHudTile
          label="COMPETITORS"
          code="ST.02"
          value={competitorCount ?? 0}
          hint="WATCHLIST"
          hue="purple"
        />
        <StatHudTile
          label="CREATORS"
          code="ST.03"
          value={creatorCount ?? 0}
          hint="WATCHLIST"
          hue="blue"
        />
        <StatHudTile
          label="FAMILIES"
          code="ST.04"
          value={clusterCount ?? 0}
          hint="DISCOVERED"
          hue="green"
        />
        <StatHudTile
          label="DNA REPORTS"
          code="ST.05"
          value={dnaCount ?? 0}
          hint="GENERATED"
          hue="red"
        />
      </div>

      {/* Middle row */}
      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <TerminalFrame
          title="opportunity_score"
          code="MOD.00.A"
          status="ONLINE"
          glow="red"
          className="relative overflow-hidden"
        >
          <CircuitFrame corner="tr" hue="red" size={60} />
          <CircuitFrame corner="bl" hue="purple" size={60} />
          <div className="relative p-6 flex flex-col items-center">
            <HudDial
              size={180}
              value={avgScore ?? "—"}
              label={avgScore != null ? "AVG DNA SCORE" : "awaiting data"}
              hue={
                avgScore == null ? "red" : avgScore >= 70 ? "green" : avgScore >= 50 ? "amber" : "red"
              }
            />
            <div className="mt-4 grid grid-cols-3 gap-2 w-full">
              <MicroLabels count={3} hue="muted" seed={0} className="text-center" />
              <MicroLabels count={3} hue="red" seed={4} className="text-center" />
              <MicroLabels count={3} hue="red" seed={2} className="text-center text-right" />
            </div>
            <div className="mt-3">
              {avgScore == null ? (
                <Badge variant="amber">! NO DATA YET</Badge>
              ) : avgScore >= 70 ? (
                <Badge variant="green">● HEALTHY PORTFOLIO</Badge>
              ) : (
                <Badge variant="pink">! NEEDS WORK</Badge>
              )}
            </div>
          </div>
        </TerminalFrame>

        <TerminalFrame
          title="emerging_trends.feed"
          code="MOD.00.B"
          status="ONLINE"
          glow="purple"
          className="lg:col-span-2"
        >
          <div className="p-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <div className="cret-mono text-[10px] uppercase tracking-[0.2em] text-ink-300 mb-2">
                  // PORTFOLIO HEALTH
                </div>
                <MeterBar
                  label="ASSETS LOGGED"
                  value={Math.min(100, ((assetCount ?? 0) / 25) * 100)}
                  hue="red"
                />
                <div className="mt-2">
                  <MeterBar
                    label="WATCHLIST DEPTH"
                    value={Math.min(100, (((competitorCount ?? 0) + (creatorCount ?? 0)) / 15) * 100)}
                    hue="purple"
                  />
                </div>
                <div className="mt-2">
                  <MeterBar
                    label="FAMILIES MAPPED"
                    value={Math.min(100, ((clusterCount ?? 0) / 6) * 100)}
                    hue="green"
                  />
                </div>
                <div className="mt-2">
                  <MeterBar
                    label="AVG QUALITY"
                    value={avgScore ?? 0}
                    hue="blue"
                  />
                </div>
              </div>
              <div>
                <div className="cret-mono text-[10px] uppercase tracking-[0.2em] text-ink-300 mb-2">
                  // SIGNAL
                </div>
                <div className="space-y-1 cret-mono text-[11px]">
                  {(assetCount ?? 0) === 0 && (
                    <SignalRow
                      type="info"
                      text="No content analyzed yet. Visit /analyze."
                    />
                  )}
                  {(assetCount ?? 0) > 0 && (clusterCount ?? 0) === 0 && (
                    <SignalRow
                      type="info"
                      text="Generate clusters at /clusters to group your content."
                    />
                  )}
                  {(competitorCount ?? 0) === 0 && (
                    <SignalRow type="info" text="No competitors tracked yet." />
                  )}
                  {(creatorCount ?? 0) === 0 && (
                    <SignalRow type="info" text="No creators tracked yet." />
                  )}
                  {(assetCount ?? 0) >= 5 && (
                    <SignalRow
                      type="alert"
                      text="Visit /trends for territory + hook analytics."
                    />
                  )}
                </div>
                <div className="mt-3 pt-3 border-t border-line-100 flex items-center justify-between">
                  <SliderRack bars={10} hue="red" height={36} />
                  <div className="cret-mono text-[9px] uppercase tracking-[0.2em] text-ink-400">
                    pattern feed
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TerminalFrame>
      </div>

      {/* Bottom row: recent activity + next actions */}
      <div className="grid lg:grid-cols-2 gap-4">
        <TerminalFrame
          title="recent.intel"
          code="MOD.00.C"
          status="ONLINE"
          glow="blue"
          className="relative overflow-hidden"
        >
          <CircuitFrame corner="tl" hue="blue" size={50} />
          <div className="p-5 space-y-2">
            {(recentAssets ?? []).length === 0 ? (
              <div className="cret-mono text-xs text-ink-300">
                No analyses yet. The feed will populate as you analyze content.
              </div>
            ) : (
              (recentAssets ?? []).map((a) => {
                const dna = Array.isArray(
                  (a as { dna: unknown }).dna
                )
                  ? (a as {
                      dna: Array<{
                        predicted_performance_score: number | null;
                        creative_family: string | null;
                        emotion: string | null;
                        hook_style: string | null;
                      }>;
                    }).dna[0]
                  : null;
                return (
                  <Link
                    key={(a as { id: string }).id}
                    href={`/library/${(a as { id: string }).id}`}
                    className="block border border-line-100 px-3 py-2 hover:border-scan-red transition"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="cret-mono text-[11px] text-ink-100 truncate">
                          {(a as { title: string | null }).title ?? "Untitled"}
                        </div>
                        <div className="cret-mono text-[9px] uppercase tracking-[0.15em] text-ink-300 mt-0.5 truncate">
                          {(a as { platform: string | null }).platform ?? "—"}
                          {dna?.creative_family ? ` · ${dna.creative_family}` : ""}
                          {dna?.emotion ? ` · ${dna.emotion}` : ""}
                        </div>
                      </div>
                      {dna?.predicted_performance_score != null && (
                        <span
                          className={
                            "cret-display text-2xl leading-none " +
                            (dna.predicted_performance_score >= 70
                              ? "text-neon-green cret-glow-green"
                              : dna.predicted_performance_score >= 50
                                ? "text-neon-amber"
                                : "text-scan-red cret-glow-red")
                          }
                        >
                          {dna.predicted_performance_score}
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </TerminalFrame>

        <TerminalFrame
          title="next_actions.queue"
          code="MOD.00.D"
          status="ONLINE"
          glow="red"
          className="relative overflow-hidden"
        >
          <div className="absolute right-3 top-3">
            <WireframeOrb size={64} hue="red" />
          </div>
          <ol className="p-5 space-y-3 cret-mono text-xs text-ink-200">
            <ActionItem
              n="01"
              href="/brand"
              title="Set up your brand profile"
              body="Tell CREATAI who you are. Every analysis is shaped by this."
              done={false}
            />
            <ActionItem
              n="02"
              href="/analyze"
              title="Analyze your first piece of content"
              body="Paste a YouTube URL, image URL, or any caption."
              done={(assetCount ?? 0) > 0}
            />
            <ActionItem
              n="03"
              href="/competitors"
              title="Add 3-5 competitors"
              body="We'll surface their breakouts and tactical shifts."
              done={(competitorCount ?? 0) >= 3}
            />
            <ActionItem
              n="04"
              href="/clusters"
              title="Generate creative clusters"
              body="Group your content into families. Find what's winning."
              done={(clusterCount ?? 0) > 0}
            />
          </ol>
        </TerminalFrame>
      </div>

      {/* Footer strip */}
      <div className="mt-6 grid sm:grid-cols-3 gap-3 cret-mono text-[10px] uppercase tracking-[0.2em] text-ink-400">
        <div className="border border-line-100 px-3 py-2 flex items-center justify-between bg-bg-1/40">
          <span>SESSION</span>
          <span className="text-neon-green">ACTIVE</span>
        </div>
        <div className="border border-line-100 px-3 py-2 flex items-center justify-between bg-bg-1/40">
          <span>OPERATOR</span>
          <span className="text-ink-200 truncate max-w-40">{user.email}</span>
        </div>
        <div className="border border-line-100 px-3 py-2 flex items-center justify-between bg-bg-1/40">
          <span>BUILD</span>
          <span className="text-scan-red">v1.0.0 · #001</span>
        </div>
      </div>
    </div>
  );
}

function StatHudTile({
  label,
  code,
  value,
  hint,
  hue,
}: {
  label: string;
  code: string;
  value: string | number;
  hint: string;
  hue: "green" | "purple" | "blue" | "red";
}) {
  const valueColor =
    hue === "green"
      ? "text-neon-green cret-glow-green"
      : hue === "purple"
        ? "text-neon-purple cret-glow-purple"
        : hue === "blue"
          ? "text-neon-blue cret-glow-blue"
          : "text-scan-red cret-glow-red";
  return (
    <div className="relative border border-line-100 bg-bg-1/70 p-4 hover:border-scan-red transition-colors overflow-hidden">
      <CircuitFrame corner="br" hue={hue} size={40} />
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="cret-mono text-[9px] uppercase tracking-[0.25em] text-ink-400">
            {code}
          </div>
          <div className="cret-mono text-[10px] uppercase tracking-[0.2em] text-ink-300 mt-0.5">
            {label}
          </div>
        </div>
        <HudDial size={34} hue={hue} spin />
      </div>
      <div className={`cret-display text-5xl leading-none ${valueColor}`}>{value}</div>
      <div className="cret-mono text-[10px] uppercase tracking-[0.15em] text-ink-400 mt-3 flex items-center justify-between">
        <span>{hint}</span>
        <span className="text-neon-green flex items-center gap-1">
          <span className="w-1 h-1 bg-neon-green cret-pulse" />
          LIVE
        </span>
      </div>
    </div>
  );
}

function SignalRow({ type, text }: { type: "info" | "alert"; text: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className={type === "alert" ? "text-scan-red" : "text-neon-blue"}>
        {type === "alert" ? "!" : "›"}
      </span>
      <span className="text-ink-200">{text}</span>
    </div>
  );
}

function ActionItem({
  n,
  href,
  title,
  body,
  done,
}: {
  n: string;
  href: string;
  title: string;
  body: string;
  done: boolean;
}) {
  return (
    <li>
      <Link
        href={href}
        className={`block border px-3 py-3 transition ${
          done
            ? "border-neon-green/40 bg-[rgba(0,255,157,0.04)]"
            : "border-line-100 hover:border-scan-red hover:cret-box-glow-red"
        }`}
      >
        <div className="flex items-start gap-3">
          <span
            className={`w-6 shrink-0 ${
              done ? "text-neon-green" : "text-scan-red"
            }`}
          >
            {done ? "✓" : n}
          </span>
          <div className="flex-1">
            <div
              className={`mb-1 ${
                done ? "text-ink-300 line-through" : "text-ink-100"
              }`}
            >
              {title}
            </div>
            <div className="text-ink-300 normal-case tracking-normal text-[11px]">
              {body}
            </div>
          </div>
        </div>
      </Link>
    </li>
  );
}
