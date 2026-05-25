import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { TerminalFrame } from "@/components/terminal-frame";
import { Badge } from "@/components/ui/badge";
import { CircuitFrame } from "@/components/hud/circuit-frame";
import { MicroLabels } from "@/components/hud/micro-labels";
import { AnalystChat } from "./analyst-chat";

export const dynamic = "force-dynamic";

export default async function AnalystPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { count: assetCount } = await supabase
    .from("content_assets")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", user.id);

  return (
    <div className="relative p-6 sm:p-8 max-w-5xl mx-auto">
      <PageHeader
        code="MOD.08 :: AI_ANALYST"
        title="AI ANALYST"
        subtitle="Your AI CMO. Reads every piece of your data. Tells you what to make next."
        right={
          <div className="flex items-center gap-3">
            <MicroLabels count={3} hue="muted" seed={9} className="hidden md:flex" />
            <Badge variant={(assetCount ?? 0) > 0 ? "purple" : "amber"}>
              {assetCount ?? 0} ASSETS IN CONTEXT
            </Badge>
          </div>
        }
      />

      <TerminalFrame
        title="ai_cmo.session"
        code="AN.01"
        status="ONLINE"
        glow="purple"
        className="relative overflow-hidden"
      >
        <CircuitFrame corner="tr" hue="red" size={50} />
        <CircuitFrame corner="bl" hue="purple" size={50} />
        <div className="p-5">
          <div className="cret-mono text-[10px] uppercase tracking-[0.3em] text-scan-red mb-3">
            // ASK ANYTHING — the analyst sees your saved content + brand
          </div>
          <AnalystChat />
        </div>
      </TerminalFrame>
    </div>
  );
}
