import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { TerminalFrame } from "@/components/terminal-frame";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CircuitFrame } from "@/components/hud/circuit-frame";
import { HudDial } from "@/components/hud/hud-dial";
import { MicroLabels } from "@/components/hud/micro-labels";
import { AnalyzeForm } from "./analyze-form";
import type { Brand, Competitor, Creator } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AnalyzePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [brandsRes, competitorsRes, creatorsRes] = await Promise.all([
    supabase.from("brands").select("*").eq("owner_id", user.id).order("created_at"),
    supabase.from("competitors").select("*").eq("owner_id", user.id).order("name"),
    supabase.from("creators").select("*").eq("owner_id", user.id).order("name"),
  ]);

  const brands = (brandsRes.data ?? []) as Brand[];
  const competitors = (competitorsRes.data ?? []) as Competitor[];
  const creators = (creatorsRes.data ?? []) as Creator[];
  const activeBrand = brands.find((b) => b.is_active) ?? brands[0] ?? null;

  return (
    <div className="relative p-6 sm:p-8 max-w-6xl mx-auto">
      <PageHeader
        code="MOD.02 :: ANALYZE_CONTENT"
        title="ANALYZE CONTENT"
        subtitle="Submit any content. CREATAI generates a 22-attribute Creative DNA report in seconds."
        right={
          <div className="flex items-center gap-3">
            <MicroLabels count={3} hue="muted" seed={4} className="hidden md:flex" />
            {activeBrand ? (
              <Badge variant="green">● {activeBrand.name.toUpperCase()}</Badge>
            ) : (
              <Link href="/brand">
                <Badge variant="amber">! SET UP BRAND →</Badge>
              </Link>
            )}
          </div>
        }
      />

      {/* Auto-extraction status strip */}
      <div className="mb-5 grid sm:grid-cols-2 lg:grid-cols-5 gap-2 cret-mono text-[10px] uppercase tracking-[0.15em]">
        <ExtractStatus platform="YouTube" status="auto" hint="transcript + thumb" />
        <ExtractStatus platform="Image URL" status="auto" hint="vision analysis" />
        <ExtractStatus platform="TikTok" status="auto" hint="apify scraper" />
        <ExtractStatus platform="Instagram" status="auto" hint="apify scraper" />
        <ExtractStatus platform="LinkedIn / X" status="auto" hint="apify scraper" />
      </div>

      <TerminalFrame
        title="dna_analysis.exe"
        code="A.01"
        status="ONLINE"
        glow="purple"
        className="relative overflow-hidden"
      >
        <CircuitFrame corner="tr" hue="red" size={60} />
        <CircuitFrame corner="bl" hue="purple" size={60} />
        <div className="absolute right-4 top-4 hidden md:block">
          <HudDial size={48} hue="red" />
        </div>

        <div className="p-6 sm:p-8">
          <div className="cret-mono text-[10px] uppercase tracking-[0.3em] text-scan-red mb-2">
            // submit content for analysis
          </div>
          <h2 className="cret-display text-3xl text-ink-100 mb-6">
            DECODE A PIECE OF CONTENT
          </h2>

          <AnalyzeForm
            brands={brands}
            activeBrandId={activeBrand?.id ?? null}
            competitors={competitors}
            creators={creators}
          />
        </div>
      </TerminalFrame>
    </div>
  );
}

function ExtractStatus({
  platform,
  status,
  hint,
}: {
  platform: string;
  status: "auto" | "manual";
  hint: string;
}) {
  return (
    <div className="border border-line-100 bg-bg-1/40 px-3 py-2 flex items-center justify-between gap-2">
      <div className="min-w-0">
        <div className="text-ink-200 truncate">{platform}</div>
        <div className="text-ink-400 text-[9px]">{hint}</div>
      </div>
      {status === "auto" ? (
        <Badge variant="green">AUTO</Badge>
      ) : (
        <Badge variant="amber">MANUAL</Badge>
      )}
    </div>
  );
}
