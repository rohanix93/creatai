import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { CircuitFrame } from "@/components/hud/circuit-frame";
import { MicroLabels } from "@/components/hud/micro-labels";
import type { ContentAsset, CreativeDnaReport } from "@/lib/types";

export const dynamic = "force-dynamic";

type Search = {
  q?: string;
  platform?: string;
  family?: string;
  emotion?: string;
  min?: string;
};

type Row = ContentAsset & { dna: CreativeDnaReport | null };

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const sp = (await searchParams) ?? {};
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  let query = supabase
    .from("content_assets")
    .select(
      `*, dna:creative_dna_reports(*)`
    )
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false })
    .limit(200);

  if (sp.platform) query = query.eq("platform", sp.platform);
  if (sp.q) {
    const term = `%${sp.q}%`;
    query = query.or(
      `title.ilike.${term},caption.ilike.${term},transcript.ilike.${term},creator_name.ilike.${term},competitor_name.ilike.${term}`
    );
  }

  const { data, error } = await query;
  const rows: Row[] = ((data ?? []) as Array<ContentAsset & { dna: CreativeDnaReport[] | CreativeDnaReport | null }>)
    .map((r) => ({
      ...r,
      dna: Array.isArray(r.dna) ? r.dna[0] ?? null : (r.dna as CreativeDnaReport | null),
    }))
    .filter((r) => {
      if (sp.family && r.dna?.creative_family !== sp.family) return false;
      if (sp.emotion && r.dna?.emotion !== sp.emotion) return false;
      if (sp.min) {
        const min = Number(sp.min);
        if (Number.isFinite(min) && (r.dna?.predicted_performance_score ?? -1) < min) return false;
      }
      return true;
    });

  // Distinct families & emotions for filters
  const families = Array.from(
    new Set(rows.map((r) => r.dna?.creative_family).filter((s): s is string => !!s))
  ).sort();
  const emotions = Array.from(
    new Set(rows.map((r) => r.dna?.emotion).filter((s): s is string => !!s))
  ).sort();

  return (
    <div className="relative p-6 sm:p-8 max-w-7xl mx-auto">
      <PageHeader
        code="MOD.03 :: CONTENT_LIBRARY"
        title="CONTENT LIBRARY"
        subtitle="Every analyzed asset. Searchable, filterable."
        right={
          <div className="flex items-center gap-3">
            <MicroLabels count={3} hue="muted" seed={6} className="hidden md:flex" />
            <Badge variant="purple">{rows.length} ASSETS</Badge>
            <Link href="/analyze">
              <Button variant="primary" size="md">
                ▶ Analyze new
              </Button>
            </Link>
          </div>
        }
      />

      {/* Filter bar */}
      <form
        action="/library"
        method="get"
        className="border border-line-100 bg-bg-1/40 p-3 mb-5 grid sm:grid-cols-5 gap-2 cret-mono"
      >
        <div className="sm:col-span-2">
          <Input
            type="search"
            name="q"
            placeholder="Search title/caption/transcript…"
            defaultValue={sp.q ?? ""}
          />
        </div>
        <Select name="platform" defaultValue={sp.platform ?? ""}>
          <option value="">All platforms</option>
          <option value="instagram">Instagram</option>
          <option value="tiktok">TikTok</option>
          <option value="youtube">YouTube</option>
          <option value="linkedin">LinkedIn</option>
          <option value="meta_ad">Meta Ad</option>
          <option value="other">Other</option>
        </Select>
        <Select name="family" defaultValue={sp.family ?? ""}>
          <option value="">All families</option>
          {families.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </Select>
        <Select name="emotion" defaultValue={sp.emotion ?? ""}>
          <option value="">All emotions</option>
          {emotions.map((e) => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </Select>
        <div className="sm:col-span-5 flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-[0.2em] text-ink-300">Min score</span>
          <Input
            type="number"
            name="min"
            min={0}
            max={100}
            placeholder="0"
            defaultValue={sp.min ?? ""}
            className="max-w-24"
          />
          <Button type="submit" variant="primary" size="sm">
            ▶ Apply
          </Button>
          <Link
            href="/library"
            className="text-[10px] uppercase tracking-[0.2em] text-ink-300 hover:text-scan-red"
          >
            clear
          </Link>
        </div>
      </form>

      {error && (
        <div className="border border-scan-red bg-[rgba(255,77,77,0.06)] px-3 py-2 cret-mono text-[10px] uppercase tracking-[0.15em] text-scan-red mb-4">
          ! {error.message}
        </div>
      )}

      {rows.length === 0 ? (
        <div className="border border-line-100 bg-bg-1/40 p-10 text-center">
          <div className="cret-display text-3xl text-ink-200 mb-2">LIBRARY EMPTY</div>
          <p className="text-ink-300 mb-4">
            Analyze your first piece of content to populate the library.
          </p>
          <Link href="/analyze">
            <Button variant="primary" size="md">
              ▶ Analyze content
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rows.map((r) => (
            <LibraryCard key={r.id} row={r} />
          ))}
        </div>
      )}
    </div>
  );
}

function LibraryCard({ row }: { row: Row }) {
  const dna = row.dna;
  const score = dna?.predicted_performance_score ?? null;
  const scoreColor =
    score == null
      ? "text-ink-300"
      : score >= 80
        ? "text-neon-green cret-glow-green"
        : score >= 60
          ? "text-neon-amber"
          : "text-scan-red cret-glow-red";

  return (
    <Link
      href={`/library/${row.id}`}
      className="group relative border border-line-100 bg-bg-1/60 hover:border-scan-red transition overflow-hidden block"
    >
      <CircuitFrame corner="br" hue="purple" size={40} />

      {row.thumbnail_url ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={row.thumbnail_url}
          alt={row.title ?? "asset"}
          className="w-full aspect-video object-cover bg-bg-2 border-b border-line-100"
        />
      ) : (
        <div className="w-full aspect-video bg-bg-2 border-b border-line-100 flex items-center justify-center">
          <span className="cret-mono text-[10px] uppercase tracking-[0.2em] text-ink-400">
            no thumbnail
          </span>
        </div>
      )}

      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="cret-mono text-[10px] uppercase tracking-[0.2em] text-ink-300">
            {row.platform ?? "—"} {row.content_type ? `· ${row.content_type}` : ""}
          </span>
          {score != null && (
            <span className={`cret-display text-3xl leading-none ${scoreColor}`}>
              {score}
            </span>
          )}
        </div>
        <div className="cret-display text-lg text-ink-100 mb-1 line-clamp-1 group-hover:text-scan-red">
          {row.title ?? row.creator_name ?? row.competitor_name ?? "Untitled"}
        </div>
        {dna?.creative_family && (
          <div className="cret-mono text-[10px] uppercase tracking-[0.15em] text-neon-purple mb-2 line-clamp-1">
            {dna.creative_family}
          </div>
        )}
        <div className="flex flex-wrap gap-1">
          {dna?.hook_style && <Badge variant="green">{dna.hook_style}</Badge>}
          {dna?.emotion && <Badge variant="pink">{dna.emotion}</Badge>}
          {dna?.content_territory && (
            <Badge variant="blue">{dna.content_territory}</Badge>
          )}
        </div>
        <div className="cret-mono text-[10px] uppercase tracking-[0.15em] text-ink-400 mt-3">
          {new Date(row.created_at).toISOString().slice(0, 10)}
        </div>
      </div>
    </Link>
  );
}
