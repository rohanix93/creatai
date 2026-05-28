import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { TerminalFrame } from "@/components/terminal-frame";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CircuitFrame } from "@/components/hud/circuit-frame";
import { HudDial } from "@/components/hud/hud-dial";
import { MicroLabels } from "@/components/hud/micro-labels";
import { ScrapeProfileButton } from "@/components/scrape-profile-button";
import { BrandForm } from "./brand-form";
import { setActiveBrand, deleteBrand } from "./actions";
import type { Brand, Platform } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function BrandPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string; new?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: brands } = await supabase
    .from("brands")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: true });

  const list = (brands ?? []) as Brand[];
  const editingId = sp.edit;
  const showForm = !!sp.new || !!editingId || list.length === 0;
  const editing = editingId ? list.find((b) => b.id === editingId) : null;

  return (
    <div className="relative p-6 sm:p-8 max-w-5xl mx-auto">
      <PageHeader
        code="MOD.01 :: BRAND_PROFILE"
        title="BRAND PROFILE"
        subtitle="Define the brand or creator profile that every analysis will be evaluated against."
        right={
          <div className="flex items-center gap-3">
            <MicroLabels count={3} hue="muted" seed={1} className="hidden md:flex" />
            <Badge variant={list.length ? "green" : "amber"}>
              {list.length ? `${list.length} BRAND${list.length > 1 ? "S" : ""}` : "NO BRAND YET"}
            </Badge>
          </div>
        }
      />

      {/* Existing brands list */}
      {list.length > 0 && !showForm && (
        <div className="space-y-3 mb-6">
          {list.map((b) => (
            <BrandRow key={b.id} brand={b} />
          ))}
          <div className="pt-2">
            <a href="/brand?new=1">
              <Button variant="primary" size="md">
                ▶ Add another brand
              </Button>
            </a>
          </div>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <TerminalFrame
          title={editing ? "edit_brand.exe" : "new_brand.exe"}
          code="B1"
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
              // {editing ? "editing brand" : "register new brand"}
            </div>
            <h2 className="cret-display text-3xl text-ink-100 mb-6">
              {editing ? editing.name : "DEFINE YOUR BRAND"}
            </h2>
            <BrandForm brand={editing} />
            {list.length > 0 && (
              <div className="mt-6 pt-6 border-t border-line-100">
                <a
                  href="/brand"
                  className="cret-mono text-[10px] uppercase tracking-[0.2em] text-ink-300 hover:text-scan-red"
                >
                  ← back to brand list
                </a>
              </div>
            )}
          </div>
        </TerminalFrame>
      )}

      {/* Existing brands quick-list when form is showing */}
      {showForm && list.length > 0 && (
        <div className="mt-6">
          <div className="cret-mono text-[10px] uppercase tracking-[0.25em] text-ink-300 mb-3">
            // your brands ({list.length})
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {list.map((b) => (
              <a
                key={b.id}
                href={`/brand?edit=${b.id}`}
                className="border border-line-100 px-4 py-3 hover:border-scan-red transition"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="cret-display text-xl text-ink-100">{b.name}</div>
                  {b.is_active && <Badge variant="green">ACTIVE</Badge>}
                </div>
                <div className="text-xs text-ink-300 truncate">
                  {b.tagline ?? "—"}
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function BrandRow({ brand }: { brand: Brand }) {
  const handles: Array<{ platform: Platform; label: string; handle: string | null }> = [
    { platform: "instagram", label: "IG",  handle: brand.handle_instagram },
    { platform: "tiktok",    label: "TT",  handle: brand.handle_tiktok },
    { platform: "youtube",   label: "YT",  handle: brand.handle_youtube },
    { platform: "linkedin",  label: "LI",  handle: brand.handle_linkedin },
    { platform: "other",     label: "X",   handle: brand.handle_twitter },
  ];
  const setHandles = handles.filter((h) => h.handle && h.handle.trim().length > 0);

  return (
    <div className="relative border border-line-100 bg-bg-1/70 p-5 hover:border-scan-red transition overflow-hidden">
      <CircuitFrame corner="br" hue="purple" size={40} />
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <div className="cret-display text-2xl text-ink-100">{brand.name}</div>
            {brand.is_active ? (
              <Badge variant="green">● ACTIVE</Badge>
            ) : (
              <Badge variant="muted">INACTIVE</Badge>
            )}
          </div>
          {brand.tagline && (
            <p className="text-sm text-scan-red cret-mono uppercase tracking-[0.2em] mb-2">
              {brand.tagline}
            </p>
          )}
          {brand.mission && (
            <p className="text-sm text-ink-200 leading-relaxed line-clamp-2 mb-3">
              {brand.mission}
            </p>
          )}

          {/* Per-handle bulk scrape row */}
          {setHandles.length > 0 && (
            <div className="border-t border-line-100 pt-3 mt-3">
              <div className="cret-mono text-[10px] uppercase tracking-[0.2em] text-ink-300 mb-2">
                // your handles — pull your own posts into the library
              </div>
              <div className="flex flex-wrap gap-2">
                {setHandles.map((h) => (
                  <div
                    key={h.platform}
                    className="border border-line-100 px-2 py-1 flex items-center gap-2 bg-bg-0/40"
                  >
                    <span className="cret-mono text-[10px] uppercase tracking-[0.2em] text-neon-purple">
                      {h.label}
                    </span>
                    <span className="cret-mono text-[10px] text-ink-200 max-w-32 truncate">
                      {h.handle}
                    </span>
                    <ScrapeProfileButton
                      handle={h.handle}
                      platform={h.platform}
                      brand_id={brand.id}
                      label="↓ pull"
                      size="sm"
                      variant="ghost"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2 shrink-0">
          <a href={`/brand/${brand.id}/dna`}>
            <Button variant="primary" size="sm">
              ▶ DNA
            </Button>
          </a>
          <a href={`/brand?edit=${brand.id}`}>
            <Button variant="secondary" size="sm">
              Edit
            </Button>
          </a>
          {!brand.is_active && (
            <form action={setActiveBrand}>
              <input type="hidden" name="id" value={brand.id} />
              <Button type="submit" variant="success" size="sm">
                Set active
              </Button>
            </form>
          )}
          <form action={deleteBrand}>
            <input type="hidden" name="id" value={brand.id} />
            <Button type="submit" variant="danger" size="sm">
              Delete
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
