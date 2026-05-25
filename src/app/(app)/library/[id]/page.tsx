import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { TerminalFrame } from "@/components/terminal-frame";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HudDial } from "@/components/hud/hud-dial";
import { CircuitFrame } from "@/components/hud/circuit-frame";
import { MeterBar, DataReadout } from "@/components/hud/data-readout";
import { MicroLabels } from "@/components/hud/micro-labels";
import { WireframeOrb } from "@/components/hud/wireframe-orb";
import { deleteAsset } from "./actions";
import type { ContentAsset, CreativeDnaReport } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DnaReportPage({
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

  const { data: asset } = await supabase
    .from("content_assets")
    .select(`*, dna:creative_dna_reports(*), brands(name)`)
    .eq("id", id)
    .eq("owner_id", user.id)
    .single();

  if (!asset) notFound();
  const a = asset as ContentAsset & {
    dna: CreativeDnaReport[] | CreativeDnaReport | null;
    brands?: { name: string } | null;
  };
  const dna = (Array.isArray(a.dna) ? a.dna[0] : a.dna) as CreativeDnaReport | null;

  return (
    <div className="relative p-6 sm:p-8 max-w-7xl mx-auto">
      <div className="mb-3">
        <Link
          href="/library"
          className="cret-mono text-[10px] uppercase tracking-[0.2em] text-ink-300 hover:text-scan-red"
        >
          ← back to library
        </Link>
      </div>

      <PageHeader
        code={`MOD.03.${a.id.slice(0, 4)} :: DNA_REPORT`}
        title={a.title ?? a.creator_name ?? "Untitled asset"}
        subtitle={[a.platform, a.content_type, a.brands?.name].filter(Boolean).join(" · ")}
        right={
          <div className="flex items-center gap-2">
            {a.source_url && (
              <a href={a.source_url} target="_blank" rel="noreferrer noopener">
                <Button variant="secondary" size="sm">
                  ↗ open source
                </Button>
              </a>
            )}
            <form action={deleteAsset}>
              <input type="hidden" name="id" value={a.id} />
              <Button type="submit" variant="danger" size="sm">
                Delete
              </Button>
            </form>
          </div>
        }
      />

      {/* TOP — score panel + thumbnail */}
      <div className="grid lg:grid-cols-3 gap-4 mb-5">
        <TerminalFrame
          title="performance.predictor"
          code="DNA.SCORE"
          status="ONLINE"
          glow="purple"
          className="relative overflow-hidden lg:col-span-1"
        >
          <CircuitFrame corner="tr" hue="red" size={60} />
          <CircuitFrame corner="bl" hue="purple" size={60} />
          <div className="p-6 flex flex-col items-center">
            <HudDial
              size={200}
              value={dna?.predicted_performance_score ?? "—"}
              label="DNA SCORE"
              hue={
                (dna?.predicted_performance_score ?? 0) >= 80
                  ? "green"
                  : (dna?.predicted_performance_score ?? 0) >= 60
                    ? "amber"
                    : "red"
              }
            />
            <div className="mt-4">
              {dna?.creative_family ? (
                <Badge variant="purple">{dna.creative_family}</Badge>
              ) : (
                <Badge variant="amber">no family</Badge>
              )}
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 w-full">
              <MicroLabels count={3} hue="muted" seed={1} className="text-center" />
              <MicroLabels count={3} hue="red" seed={3} className="text-center" />
              <MicroLabels count={3} hue="muted" seed={5} className="text-right" />
            </div>
          </div>
        </TerminalFrame>

        <TerminalFrame
          title="sub_scores.matrix"
          code="DNA.SUB"
          status="ONLINE"
          glow="purple"
          className="lg:col-span-2 relative overflow-hidden"
        >
          <CircuitFrame corner="br" hue="purple" size={48} />
          <div className="p-5 grid sm:grid-cols-2 gap-4">
            <MeterBar label="HOOK" value={dna?.hook_score ?? 0} hue="red" />
            <MeterBar label="RETENTION" value={dna?.retention_score ?? 0} hue="purple" />
            <MeterBar label="ENGAGEMENT" value={dna?.engagement_score ?? 0} hue="green" />
            <MeterBar label="CONVERSION" value={dna?.conversion_score ?? 0} hue="blue" />
            <MeterBar label="NOVELTY" value={dna?.novelty_score ?? 0} hue="amber" />
            <div className="grid grid-cols-3 gap-2 items-center border border-line-100 px-3 py-2">
              <div className="col-span-2 cret-mono text-[10px] uppercase tracking-[0.15em] text-ink-300">
                Extraction
              </div>
              <Badge
                variant={a.extraction_source === "manual" ? "amber" : "green"}
                className="justify-self-end"
              >
                {(a.extraction_source ?? "manual").toUpperCase()}
              </Badge>
            </div>
          </div>
        </TerminalFrame>
      </div>

      {/* ATTRIBUTES + thumbnail */}
      <div className="grid lg:grid-cols-3 gap-4 mb-5">
        <TerminalFrame
          title="attribute.matrix"
          code="DNA.ATTR"
          status="ONLINE"
          glow="purple"
          className="lg:col-span-2 relative overflow-hidden"
        >
          <CircuitFrame corner="tr" hue="red" size={48} />
          <div className="p-5 grid sm:grid-cols-2 gap-4 cret-mono text-[10px] uppercase tracking-[0.15em]">
            <DataReadout
              hue="red"
              rows={[
                ["HOOK STYLE", dna?.hook_style ?? "—"],
                ["CONTENT TYPE", dna?.content_type ?? "—"],
                ["FORMAT", dna?.format ?? "—"],
                ["TONE", dna?.tone ?? "—"],
                ["EMOTION", dna?.emotion ?? "—"],
                ["VISUAL STYLE", dna?.visual_style ?? "—"],
                ["CTA QUALITY", dna?.cta_quality ?? "—"],
                ["TERRITORY", dna?.content_territory ?? "—"],
              ]}
            />
            <DataReadout
              hue="purple"
              rows={[
                ["AUDIENCE STAGE", dna?.audience_stage ?? "—"],
                ["PRODUCT ROLE", dna?.product_role ?? "—"],
                ["PSYCH TRIGGER", dna?.psychological_trigger ?? "—"],
                ["BRAND PRESENCE", dna?.brand_presence ?? "—"],
                ["CREATOR PRESENCE", dna?.creator_presence ?? "—"],
                ["STORY STRUCTURE", dna?.storytelling_structure ?? "—"],
                ["FAMILY", dna?.creative_family ?? "—"],
                ["MODEL", dna?.model ?? "gpt-4o-mini"],
              ]}
            />
          </div>
        </TerminalFrame>

        <TerminalFrame
          title="asset.preview"
          code="A.PRV"
          status="ONLINE"
          glow="green"
          className="relative overflow-hidden"
        >
          <div className="absolute right-3 top-12 hidden sm:block">
            <WireframeOrb size={60} hue="green" />
          </div>
          <div className="p-4">
            {a.thumbnail_url ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={a.thumbnail_url}
                alt="thumbnail"
                className="w-full border border-line-100 mb-3"
              />
            ) : (
              <div className="w-full aspect-video bg-bg-2 border border-line-100 mb-3 flex items-center justify-center cret-mono text-[10px] uppercase tracking-[0.2em] text-ink-400">
                no thumbnail
              </div>
            )}
            <div className="cret-mono text-[10px] uppercase tracking-[0.15em] space-y-1.5">
              <KV k="VIEWS" v={a.views} />
              <KV k="LIKES" v={a.likes} />
              <KV k="COMMENTS" v={a.comments} />
              <KV k="SHARES" v={a.shares} />
              <KV k="SAVES" v={a.saves} />
              <KV k="SPEND" v={a.spend != null ? `$${a.spend}` : null} />
              <KV k="CONV" v={a.conversions} />
            </div>
          </div>
        </TerminalFrame>
      </div>

      {/* NARRATIVE + ideas */}
      <div className="grid lg:grid-cols-3 gap-4 mb-5">
        <NarrativeBlock label="WHAT'S WORKING" body={dna?.what_is_working} hue="green" />
        <NarrativeBlock label="WHAT'S WEAK" body={dna?.what_is_weak} hue="red" />
        <NarrativeBlock label="WHAT TO IMPROVE" body={dna?.what_to_improve} hue="amber" />
      </div>

      <TerminalFrame
        title="next_creatives.queue"
        code="DNA.IDEAS"
        status="ONLINE"
        glow="purple"
        className="relative overflow-hidden mb-5"
      >
        <CircuitFrame corner="tr" hue="red" size={50} />
        <div className="p-5">
          <div className="cret-mono text-[10px] uppercase tracking-[0.3em] text-scan-red mb-3">
            // 5 NEXT-MOVE IDEAS FOR THIS BRAND
          </div>
          <ol className="space-y-2">
            {(dna?.content_ideas ?? []).map((idea, i) => (
              <li
                key={i}
                className="flex items-start gap-3 border border-line-100 px-3 py-2"
              >
                <span className="cret-display text-2xl text-scan-red cret-glow-red leading-none w-8 shrink-0">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-ink-200 leading-snug">{idea}</span>
              </li>
            ))}
            {(!dna?.content_ideas || dna.content_ideas.length === 0) && (
              <li className="text-ink-400 cret-mono text-xs uppercase tracking-[0.2em]">
                no ideas generated.
              </li>
            )}
          </ol>
        </div>
      </TerminalFrame>

      {/* RAW INPUTS */}
      <div className="grid lg:grid-cols-2 gap-4">
        <TerminalFrame title="raw.caption" code="A.CAP" status="ONLINE" glow="purple">
          <div className="p-5 text-sm text-ink-200 whitespace-pre-wrap leading-relaxed">
            {a.caption || (
              <span className="text-ink-400 cret-mono text-xs uppercase tracking-[0.2em]">
                no caption provided
              </span>
            )}
          </div>
        </TerminalFrame>
        <TerminalFrame title="raw.transcript" code="A.TXT" status="ONLINE" glow="blue">
          <div className="p-5 text-sm text-ink-200 whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
            {a.transcript || (
              <span className="text-ink-400 cret-mono text-xs uppercase tracking-[0.2em]">
                no transcript
              </span>
            )}
          </div>
        </TerminalFrame>
      </div>
    </div>
  );
}

function KV({ k, v }: { k: string; v: number | string | null }) {
  return (
    <div className="flex items-center justify-between border-b border-line-100/40 py-0.5">
      <span className="text-ink-400">{k}</span>
      <span className={v == null ? "text-ink-400" : "text-ink-100 tabular-nums"}>
        {v == null ? "—" : v}
      </span>
    </div>
  );
}

function NarrativeBlock({
  label,
  body,
  hue,
}: {
  label: string;
  body: string | null | undefined;
  hue: "green" | "red" | "amber";
}) {
  const accent =
    hue === "green"
      ? "text-neon-green"
      : hue === "amber"
        ? "text-neon-amber"
        : "text-scan-red";
  return (
    <div className="relative border border-line-100 bg-bg-1/60 p-5 overflow-hidden">
      <CircuitFrame corner="br" hue={hue === "amber" ? "purple" : hue} size={40} />
      <div
        className={`cret-mono text-[10px] uppercase tracking-[0.3em] mb-2 ${accent}`}
      >
        // {label}
      </div>
      <p className="text-sm text-ink-200 leading-relaxed">
        {body ?? (
          <span className="text-ink-400 cret-mono uppercase tracking-[0.2em]">
            no analysis
          </span>
        )}
      </p>
    </div>
  );
}
