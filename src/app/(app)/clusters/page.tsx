import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { TerminalFrame } from "@/components/terminal-frame";
import { Badge } from "@/components/ui/badge";
import { CircuitFrame } from "@/components/hud/circuit-frame";
import { HudDial } from "@/components/hud/hud-dial";
import { MicroLabels } from "@/components/hud/micro-labels";
import { RegenerateButton } from "./regenerate-button";
import type { CreativeCluster } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ClustersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data, count } = await supabase
    .from("creative_clusters")
    .select("*", { count: "exact" })
    .eq("owner_id", user.id)
    .order("asset_count", { ascending: false });

  const clusters = (data ?? []) as CreativeCluster[];

  const { count: assetCount } = await supabase
    .from("content_assets")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", user.id);

  return (
    <div className="relative p-6 sm:p-8 max-w-7xl mx-auto">
      <PageHeader
        code="MOD.06 :: CREATIVE_CLUSTERS"
        title="CREATIVE CLUSTERS"
        subtitle="Content grouped into creative families. See which patterns are winning."
        right={
          <div className="flex items-center gap-3">
            <MicroLabels count={3} hue="muted" seed={7} className="hidden md:flex" />
            <Badge variant={clusters.length ? "purple" : "amber"}>
              {clusters.length} CLUSTERS
            </Badge>
            <RegenerateButton disabled={(assetCount ?? 0) < 2} />
          </div>
        }
      />

      {(assetCount ?? 0) < 2 && (
        <div className="border border-neon-amber bg-[rgba(255,176,32,0.06)] px-4 py-3 cret-mono text-xs uppercase tracking-[0.15em] text-neon-amber mb-5">
          ! Analyze at least 2 pieces of content before generating clusters.{" "}
          <Link href="/analyze" className="text-scan-red underline">
            Go to /analyze
          </Link>
        </div>
      )}

      {clusters.length === 0 ? (
        <div className="border border-line-100 bg-bg-1/40 p-10 text-center">
          <div className="cret-display text-3xl text-ink-200 mb-2">NO CLUSTERS YET</div>
          <p className="text-ink-300">
            Click "Regenerate clusters" above to group your analyzed content into families.
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {clusters.map((c) => (
            <TerminalFrame
              key={c.id}
              title={c.name.toLowerCase().replace(/\s+/g, "_")}
              code={`C.${c.id.slice(0, 4)}`}
              status="ONLINE"
              glow="purple"
              className="relative overflow-hidden"
            >
              <CircuitFrame corner="tr" hue="red" size={50} />
              <CircuitFrame corner="bl" hue="purple" size={50} />
              <div className="p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <div className="cret-mono text-[10px] uppercase tracking-[0.3em] text-scan-red mb-1">
                      // creative_family
                    </div>
                    <div className="cret-display text-2xl text-ink-100 leading-tight">
                      {c.name}
                    </div>
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-1">
                    <HudDial
                      size={60}
                      value={c.avg_performance_score ?? "—"}
                      hue={
                        (c.avg_performance_score ?? 0) >= 70
                          ? "green"
                          : (c.avg_performance_score ?? 0) >= 50
                            ? "amber"
                            : "red"
                      }
                    />
                    <Badge variant="muted">{c.asset_count} assets</Badge>
                  </div>
                </div>

                <p className="text-sm text-ink-200 mb-4 leading-snug">
                  {c.description}
                </p>

                <div className="grid grid-cols-3 gap-2 mb-4">
                  <KV k="HOOK" v={c.common_hook_style} />
                  <KV k="EMOTION" v={c.common_emotion} />
                  <KV k="TERRITORY" v={c.common_territory} />
                </div>

                <div className="border-t border-line-100 pt-3">
                  <div className="cret-mono text-[10px] uppercase tracking-[0.2em] text-neon-green mb-1">
                    // WHY IT MATTERS
                  </div>
                  <p className="text-xs text-ink-200 mb-3 leading-snug">
                    {c.why_it_matters}
                  </p>
                  <div className="cret-mono text-[10px] uppercase tracking-[0.2em] text-scan-red mb-1">
                    // NEXT MOVE
                  </div>
                  <p className="text-xs text-ink-200 leading-snug">
                    {c.recommended_next_move}
                  </p>
                </div>
              </div>
            </TerminalFrame>
          ))}
        </div>
      )}
    </div>
  );
}

function KV({ k, v }: { k: string; v: string | null | undefined }) {
  return (
    <div className="border border-line-100 px-2 py-1">
      <div className="cret-mono text-[9px] uppercase tracking-[0.15em] text-ink-400">
        {k}
      </div>
      <div className="cret-mono text-[11px] text-ink-100 truncate">{v ?? "—"}</div>
    </div>
  );
}
