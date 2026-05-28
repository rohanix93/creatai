import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { TerminalFrame } from "@/components/terminal-frame";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HudDial } from "@/components/hud/hud-dial";
import { CircuitFrame } from "@/components/hud/circuit-frame";
import { MicroLabels } from "@/components/hud/micro-labels";
import { MeterBar } from "@/components/hud/data-readout";
import { WireframeOrb } from "@/components/hud/wireframe-orb";
import { GenerateBrandDnaButton } from "./generate-button";
import type { Brand, BrandAnalysis } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function BrandDnaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: brand } = await supabase
    .from("brands")
    .select("*")
    .eq("id", id)
    .eq("owner_id", user.id)
    .single();
  if (!brand) notFound();
  const b = brand as Brand;

  // Latest analysis
  const { data: analyses } = await supabase
    .from("brand_analyses")
    .select("*")
    .eq("brand_id", id)
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1);
  const a = (analyses?.[0] as BrandAnalysis | undefined) ?? null;

  // Asset count for the "ready to analyze?" UI
  const { count: assetCount } = await supabase
    .from("content_assets")
    .select("id", { count: "exact", head: true })
    .eq("brand_id", id)
    .eq("owner_id", user.id);

  return (
    <div className="relative p-6 sm:p-8 max-w-7xl mx-auto">
      <div className="mb-3">
        <Link
          href="/brand"
          className="cret-mono text-[10px] uppercase tracking-[0.2em] text-ink-300 hover:text-scan-red"
        >
          ← back to brand list
        </Link>
      </div>

      <PageHeader
        code={`MOD.01.${b.id.slice(0, 4)} :: BRAND_DNA`}
        title={`${b.name} :: BRAND DNA`}
        subtitle={
          a
            ? `Last synthesized ${new Date(a.created_at).toISOString().slice(0, 16).replace("T", " ")} over ${a.asset_count_at_analysis} assets.`
            : "No analysis yet. Pull your content via brand handles, then synthesize."
        }
        right={
          <div className="flex items-center gap-3">
            <MicroLabels count={3} hue="muted" seed={2} className="hidden md:flex" />
            <GenerateBrandDnaButton brandId={b.id} disabled={(assetCount ?? 0) < 3} />
          </div>
        }
      />

      {(assetCount ?? 0) < 3 && !a && (
        <div className="border border-neon-amber bg-[rgba(255,176,32,0.06)] px-4 py-3 cret-mono text-xs uppercase tracking-[0.15em] text-neon-amber mb-6">
          ! Need at least 3 of your own posts in the Library to synthesize. You have {assetCount ?? 0}.
          {" "}
          <Link href="/brand" className="text-scan-red underline">
            Add handles & pull posts →
          </Link>
        </div>
      )}

      {!a ? (
        <div className="border border-line-100 bg-bg-1/40 p-10 text-center">
          <div className="cret-display text-3xl text-ink-200 mb-2">NO BRAND DNA YET</div>
          <p className="text-ink-300 mb-4">
            Click "Generate brand DNA" above to synthesize.
          </p>
        </div>
      ) : (
        <BrandDnaReport analysis={a} />
      )}
    </div>
  );
}

function BrandDnaReport({ analysis: a }: { analysis: BrandAnalysis }) {
  const score = a.virality_score ?? 0;
  const scoreHue: "green" | "amber" | "red" =
    score >= 75 ? "green" : score >= 50 ? "amber" : "red";

  const mult = a.growth_multiplier ?? 1;

  return (
    <div className="space-y-5">
      {/* TOP: Niche + score + aspiration */}
      <div className="grid lg:grid-cols-3 gap-4">
        <TerminalFrame
          title="virality.score"
          code="DNA.SCORE"
          status="ONLINE"
          glow={scoreHue === "green" ? "green" : scoreHue === "amber" ? "purple" : "red"}
          className="relative overflow-hidden"
        >
          <CircuitFrame corner="tr" hue="red" size={50} />
          <CircuitFrame corner="bl" hue="purple" size={50} />
          <div className="p-6 flex flex-col items-center">
            <HudDial size={180} value={score} label="VIRALITY" hue={scoreHue} />
            <div className="cret-mono text-[10px] uppercase tracking-[0.2em] text-ink-300 mt-4">
              0-100 honest assessment
            </div>
          </div>
        </TerminalFrame>

        <TerminalFrame
          title="niche.detect"
          code="DNA.NICHE"
          status="ONLINE"
          glow="purple"
          className="lg:col-span-2 relative overflow-hidden"
        >
          <CircuitFrame corner="br" hue="purple" size={50} />
          <div className="p-6">
            <div className="cret-mono text-[10px] uppercase tracking-[0.3em] text-scan-red mb-2">
              // niche detected
            </div>
            <div className="cret-display text-4xl text-neon-purple cret-glow-purple mb-4">
              {a.niche ?? "—"}
            </div>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {(a.audience_tags ?? []).map((t) => (
                <Badge key={t} variant="purple">
                  #{t.replace(/^#/, "")}
                </Badge>
              ))}
            </div>
            <p className="text-ink-200 leading-relaxed text-sm whitespace-pre-wrap">
              {a.summary ?? "—"}
            </p>
          </div>
        </TerminalFrame>
      </div>

      {/* Growth potential */}
      <TerminalFrame
        title="growth.potential"
        code="DNA.GROW"
        status="ONLINE"
        glow="green"
        className="relative overflow-hidden"
      >
        <CircuitFrame corner="tr" hue="green" size={50} />
        <div className="p-6 grid sm:grid-cols-3 gap-6 items-center">
          <div className="text-center">
            <div className="cret-mono text-[10px] uppercase tracking-[0.2em] text-ink-300 mb-2">
              projected uplift
            </div>
            <div className="cret-display text-6xl text-neon-green cret-glow-green leading-none">
              {mult.toFixed(1)}×
            </div>
            <div className="cret-mono text-[10px] uppercase tracking-[0.15em] text-ink-400 mt-2">
              30-day view multiplier
            </div>
          </div>
          <div className="sm:col-span-2">
            <div className="cret-mono text-[10px] uppercase tracking-[0.2em] text-ink-300 mb-3">
              // growth curve
            </div>
            <div className="grid grid-cols-[60px_1fr] gap-y-2 gap-x-3 items-center">
              {(a.growth_curve ?? []).map((p) => (
                <FragmentRow key={p.day} day={p.day} mult={p.multiplier} max={mult} />
              ))}
            </div>
          </div>
        </div>
      </TerminalFrame>

      {/* Strengths + Areas to improve */}
      <div className="grid lg:grid-cols-2 gap-4">
        <TerminalFrame
          title="strengths.lock"
          code="DNA.STR"
          status="ONLINE"
          glow="green"
          className="relative overflow-hidden"
        >
          <CircuitFrame corner="br" hue="green" size={40} />
          <div className="p-5">
            <div className="cret-mono text-[10px] uppercase tracking-[0.3em] text-neon-green mb-3">
              // WHAT YOU'RE WINNING ON
            </div>
            <ul className="space-y-3">
              {(a.strengths ?? []).map((s, i) => (
                <li key={i} className="border border-line-100 px-3 py-2">
                  <div className="flex items-start gap-2">
                    <span className="text-neon-green">✓</span>
                    <div>
                      <div className="text-ink-100 cret-mono text-sm mb-1">
                        {s.title}
                      </div>
                      {s.evidence && (
                        <div className="text-ink-300 text-xs leading-snug">
                          {s.evidence}
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </TerminalFrame>

        <TerminalFrame
          title="areas.fix"
          code="DNA.FIX"
          status="ONLINE"
          glow="red"
          className="relative overflow-hidden"
        >
          <CircuitFrame corner="br" hue="red" size={40} />
          <div className="p-5">
            <div className="cret-mono text-[10px] uppercase tracking-[0.3em] text-scan-red mb-3">
              // WHAT'S HOLDING YOU BACK
            </div>
            <ul className="space-y-3">
              {(a.areas_to_improve ?? []).map((s, i) => (
                <li key={i} className="border border-line-100 px-3 py-2">
                  <div className="flex items-start gap-2">
                    <span className="text-scan-red">!</span>
                    <div>
                      <div className="text-ink-100 cret-mono text-sm mb-1">
                        {s.title}
                      </div>
                      {s.evidence && (
                        <div className="text-ink-300 text-xs leading-snug mb-1">
                          {s.evidence}
                        </div>
                      )}
                      {s.fix && (
                        <div className="text-neon-green text-xs leading-snug">
                          → fix: {s.fix}
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </TerminalFrame>
      </div>

      {/* Underperformers (pain panel) */}
      {(a.underperformers ?? []).length > 0 && (
        <TerminalFrame
          title="underperformers.queue"
          code="DNA.PAIN"
          status="BUSY"
          glow="red"
          className="relative overflow-hidden"
        >
          <div className="absolute right-3 top-3">
            <WireframeOrb size={56} hue="red" />
          </div>
          <div className="p-5">
            <div className="cret-mono text-[10px] uppercase tracking-[0.3em] text-scan-red mb-3">
              // you posted these. Nobody saw them.
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {(a.underperformers ?? []).map((u) => (
                <Link
                  key={u.asset_id}
                  href={`/library/${u.asset_id}`}
                  className="border border-line-100 px-3 py-3 hover:border-scan-red transition"
                >
                  <div className="cret-display text-2xl text-scan-red cret-glow-red mb-1">
                    {u.views != null ? `${u.views.toLocaleString()}` : "—"}
                  </div>
                  <div className="cret-mono text-[10px] uppercase tracking-[0.15em] text-ink-400 mb-2">
                    views
                  </div>
                  <div className="text-ink-100 text-sm mb-2 line-clamp-2">
                    {u.title}
                  </div>
                  <div className="text-ink-300 text-xs leading-snug">{u.reason}</div>
                </Link>
              ))}
            </div>
          </div>
        </TerminalFrame>
      )}

      {/* Aspiration */}
      <TerminalFrame
        title="aspiration.target"
        code="DNA.ASP"
        status="ONLINE"
        glow="purple"
        className="relative overflow-hidden"
      >
        <CircuitFrame corner="tl" hue="purple" size={50} />
        <CircuitFrame corner="br" hue="green" size={50} />
        <div className="p-6 sm:p-8 text-center">
          <div className="cret-mono text-[10px] uppercase tracking-[0.3em] text-neon-purple mb-2">
            // your plan is ready
          </div>
          <div className="cret-display text-3xl sm:text-5xl text-neon-green cret-glow-green leading-none mb-2">
            {a.target_followers
              ? a.target_followers.toLocaleString()
              : "—"}
          </div>
          <div className="cret-mono text-[10px] uppercase tracking-[0.3em] text-ink-300 mb-4">
            FOLLOWERS BY{" "}
            <span className="text-neon-purple">
              {a.target_date
                ? new Date(a.target_date).toISOString().slice(0, 10)
                : "—"}
            </span>
          </div>
          {a.aspiration_statement && (
            <p className="text-ink-200 max-w-2xl mx-auto text-sm leading-relaxed">
              {a.aspiration_statement}
            </p>
          )}
        </div>
      </TerminalFrame>

      {/* Plan: hooks + ideas + cadence */}
      <div className="grid lg:grid-cols-2 gap-4">
        <TerminalFrame
          title="hooks.recommended"
          code="DNA.HOOK"
          status="ONLINE"
          glow="green"
          className="relative overflow-hidden"
        >
          <CircuitFrame corner="tr" hue="red" size={40} />
          <div className="p-5">
            <div className="cret-mono text-[10px] uppercase tracking-[0.3em] text-neon-green mb-3">
              // hooks fit to your voice
            </div>
            <ul className="space-y-2">
              {(a.recommended_hooks ?? []).map((h, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 border border-line-100 px-3 py-2"
                >
                  <span className="cret-display text-2xl text-neon-green cret-glow-green leading-none w-8 shrink-0">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-ink-200 text-sm leading-snug">{h}</span>
                </li>
              ))}
            </ul>
          </div>
        </TerminalFrame>

        <TerminalFrame
          title="cadence.rhythm"
          code="DNA.CAD"
          status="ONLINE"
          glow="purple"
          className="relative overflow-hidden"
        >
          <CircuitFrame corner="br" hue="purple" size={40} />
          <div className="p-6">
            <div className="cret-mono text-[10px] uppercase tracking-[0.3em] text-neon-purple mb-3">
              // posting cadence
            </div>
            <div className="text-ink-100 text-base leading-relaxed">
              {a.posting_cadence ?? "—"}
            </div>
            <div className="mt-6 pt-6 border-t border-line-100">
              <MeterBar label="current activity" value={40} hue="amber" />
              <div className="mt-2">
                <MeterBar label="recommended" value={75} hue="green" />
              </div>
            </div>
          </div>
        </TerminalFrame>
      </div>

      {/* Content ideas */}
      <TerminalFrame
        title="next_content.queue"
        code="DNA.IDEAS"
        status="ONLINE"
        glow="purple"
        className="relative overflow-hidden"
      >
        <CircuitFrame corner="tr" hue="red" size={50} />
        <div className="p-5">
          <div className="cret-mono text-[10px] uppercase tracking-[0.3em] text-scan-red mb-3">
            // {a.content_ideas?.length ?? 0} ideas to ship next
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            {(a.content_ideas ?? []).map((c, i) => (
              <div key={i} className="border border-line-100 px-4 py-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="cret-mono text-[10px] uppercase tracking-[0.2em] text-neon-green">
                    IDEA.{String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="cret-mono text-[10px] uppercase tracking-[0.15em] text-ink-400">
                    {c.format ?? "—"}
                  </span>
                </div>
                <div className="cret-display text-xl text-ink-100 mb-2">
                  {c.title}
                </div>
                <div className="cret-mono text-[10px] uppercase tracking-[0.15em] text-scan-red mb-1">
                  HOOK
                </div>
                <p className="text-ink-200 text-sm mb-2 leading-snug">"{c.hook}"</p>
                {c.why && (
                  <p className="text-ink-300 text-xs leading-snug">
                    <span className="text-neon-green">why:</span> {c.why}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </TerminalFrame>
    </div>
  );
}

function FragmentRow({
  day,
  mult,
  max,
}: {
  day: number;
  mult: number;
  max: number;
}) {
  const pct = Math.min(100, (mult / Math.max(1, max)) * 100);
  return (
    <>
      <div className="cret-mono text-[10px] uppercase tracking-[0.15em] text-ink-300">
        Day {day}
      </div>
      <div className="flex items-center gap-3">
        <div className="relative h-2 flex-1 border border-line-100 bg-bg-0">
          <div
            className="absolute inset-y-0 left-0"
            style={{
              width: `${pct}%`,
              background: "linear-gradient(90deg, var(--neon-green), var(--neon-purple))",
              opacity: 0.85,
            }}
          />
        </div>
        <div className="cret-display text-base text-neon-green w-10 text-right">
          {mult.toFixed(1)}×
        </div>
      </div>
    </>
  );
}
