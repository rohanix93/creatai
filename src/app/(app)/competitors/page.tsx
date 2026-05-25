import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { TerminalFrame } from "@/components/terminal-frame";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CircuitFrame } from "@/components/hud/circuit-frame";
import { WatchlistForm } from "@/components/watchlist-form";
import { upsertCompetitor, deleteCompetitor } from "./actions";
import type { Competitor } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function CompetitorsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("competitors")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  const list = (data ?? []) as Competitor[];

  return (
    <div className="relative p-6 sm:p-8 max-w-5xl mx-auto">
      <PageHeader
        code="MOD.04 :: COMPETITOR_WATCHLIST"
        title="COMPETITORS"
        subtitle="Track competitors. Pin their content for ongoing DNA comparison."
        right={<Badge variant={list.length ? "purple" : "amber"}>{list.length} TRACKED</Badge>}
      />

      <TerminalFrame
        title="add_competitor.exe"
        code="W.01"
        status="ONLINE"
        glow="purple"
        className="relative overflow-hidden mb-6"
      >
        <CircuitFrame corner="br" hue="red" size={50} />
        <div className="p-5">
          <div className="cret-mono text-[10px] uppercase tracking-[0.3em] text-scan-red mb-3">
            // add competitor to watchlist
          </div>
          <WatchlistForm variant="competitor" action={upsertCompetitor} />
        </div>
      </TerminalFrame>

      {list.length === 0 ? (
        <div className="border border-line-100 bg-bg-1/40 p-6 text-center text-ink-300 cret-mono text-sm">
          No competitors tracked yet. Add one above.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {list.map((c) => (
            <div
              key={c.id}
              className="relative border border-line-100 bg-bg-1/60 p-4 hover:border-scan-red transition overflow-hidden"
            >
              <CircuitFrame corner="br" hue="purple" size={36} />
              <div className="flex items-start justify-between gap-3 pr-8">
                <div className="min-w-0 flex-1">
                  <div className="cret-display text-xl text-ink-100 truncate">
                    {c.name}
                  </div>
                  <div className="cret-mono text-[10px] uppercase tracking-[0.2em] text-ink-300 mt-0.5 truncate">
                    {c.platform ?? "—"}
                    {c.category ? ` · ${c.category}` : ""}
                  </div>
                  {c.handle_or_url && (
                    <a
                      href={c.handle_or_url.startsWith("http") ? c.handle_or_url : `https://${c.handle_or_url}`}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="cret-mono text-[10px] text-scan-red hover:cret-glow-red mt-1 inline-block truncate max-w-full"
                    >
                      {c.handle_or_url}
                    </a>
                  )}
                  {c.notes && (
                    <p className="text-xs text-ink-200 mt-2 line-clamp-2">{c.notes}</p>
                  )}
                </div>
                <form action={deleteCompetitor}>
                  <input type="hidden" name="id" value={c.id} />
                  <Button type="submit" variant="danger" size="sm">
                    ✕
                  </Button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
