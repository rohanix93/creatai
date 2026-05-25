import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { openai, MODELS } from "@/lib/openai";
import { z } from "zod";

export const runtime = "nodejs";
export const maxDuration = 60;

const clusterSchema = z.object({
  clusters: z
    .array(
      z.object({
        name: z.string(),
        description: z.string(),
        common_hook_style: z.string().optional().nullable(),
        common_emotion: z.string().optional().nullable(),
        common_territory: z.string().optional().nullable(),
        why_it_matters: z.string(),
        recommended_next_move: z.string(),
        asset_ids: z.array(z.string()).min(1),
      })
    )
    .min(1),
});

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Load all user's DNA reports + asset metadata
  const { data: rows } = await supabase
    .from("creative_dna_reports")
    .select(
      `id, asset_id, hook_style, emotion, content_territory, creative_family, predicted_performance_score,
       asset:content_assets(id, title, creator_name, competitor_name, platform, content_type)`
    )
    .eq("owner_id", user.id);

  type AssetSlim = {
    id: string;
    title: string | null;
    creator_name: string | null;
    competitor_name: string | null;
    platform: string | null;
    content_type: string | null;
  };
  type Joined = {
    id: string;
    asset_id: string;
    hook_style: string | null;
    emotion: string | null;
    content_territory: string | null;
    creative_family: string | null;
    predicted_performance_score: number | null;
    asset: AssetSlim | AssetSlim[] | null;
  };
  const list = ((rows ?? []) as unknown as Joined[]).map((r) => ({
    ...r,
    asset: Array.isArray(r.asset) ? r.asset[0] ?? null : r.asset,
  }));

  if (list.length === 0) {
    return NextResponse.json(
      { error: "No analyses yet — generate at least 2 Creative DNA reports before clustering." },
      { status: 400 }
    );
  }

  if (list.length < 2) {
    return NextResponse.json(
      { error: "Need at least 2 reports to form clusters." },
      { status: 400 }
    );
  }

  // Build a compact summary for the LLM
  const summaries = list
    .map(
      (r) =>
        `{asset_id: "${r.asset_id}", title: "${r.asset?.title ?? "Untitled"}", platform: "${r.asset?.platform ?? "—"}", hook: "${r.hook_style ?? "—"}", emotion: "${r.emotion ?? "—"}", territory: "${r.content_territory ?? "—"}", family: "${r.creative_family ?? "—"}", score: ${r.predicted_performance_score ?? "null"}}`
    )
    .join("\n");

  const sys = `You are CREATAI's clustering analyst. You group analyzed content into creative families based on shared hook style, emotion, territory, and overall pattern.

Rules:
- Each cluster name is short, memorable, in Title Case (e.g. "Founder Confession Stories", "Money Mistake Explainers").
- Reuse the "creative_family" labels from the data when they form coherent groups.
- Every asset must belong to exactly one cluster.
- A cluster must contain at least 1 asset. Singletons are fine if the asset is genuinely distinct.
- "why_it_matters": 2 sentences explaining the strategic insight.
- "recommended_next_move": 1-2 sentences with a concrete next creative action.
- Output strictly the JSON schema.`;

  const usr = `## ANALYZED ASSETS (${list.length})
${summaries}

Group these into creative families. Be intelligent — if all assets are similar, return 1-2 broad clusters. If varied, return 3-6 clusters.`;

  try {
    const completion = await openai().chat.completions.create({
      model: MODELS.analysis,
      messages: [
        { role: "system", content: sys },
        { role: "user", content: usr },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "Clusters",
          schema: {
            type: "object",
            properties: {
              clusters: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    description: { type: "string" },
                    common_hook_style: { type: "string" },
                    common_emotion: { type: "string" },
                    common_territory: { type: "string" },
                    why_it_matters: { type: "string" },
                    recommended_next_move: { type: "string" },
                    asset_ids: { type: "array", items: { type: "string" } },
                  },
                  required: [
                    "name",
                    "description",
                    "common_hook_style",
                    "common_emotion",
                    "common_territory",
                    "why_it_matters",
                    "recommended_next_move",
                    "asset_ids",
                  ],
                  additionalProperties: false,
                },
              },
            },
            required: ["clusters"],
            additionalProperties: false,
          },
          strict: true,
        },
      },
    });
    const text = completion.choices[0]?.message?.content ?? "{}";
    const parsed = clusterSchema.safeParse(JSON.parse(text));
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Cluster output malformed", details: parsed.error.issues },
        { status: 502 }
      );
    }

    // Replace clusters: delete all existing, insert new
    await supabase.from("creative_clusters").delete().eq("owner_id", user.id);

    const validAssetIds = new Set(list.map((r) => r.asset_id));
    const rowsToInsert = parsed.data.clusters.map((c) => {
      const filtered = c.asset_ids.filter((id) => validAssetIds.has(id));
      const scores = filtered
        .map((id) => list.find((l) => l.asset_id === id)?.predicted_performance_score ?? null)
        .filter((s): s is number => s != null);
      const avg = scores.length
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : null;
      return {
        owner_id: user.id,
        name: c.name,
        description: c.description,
        common_hook_style: c.common_hook_style ?? null,
        common_emotion: c.common_emotion ?? null,
        common_territory: c.common_territory ?? null,
        avg_performance_score: avg,
        asset_count: filtered.length,
        why_it_matters: c.why_it_matters,
        recommended_next_move: c.recommended_next_move,
        asset_ids: filtered,
      };
    });

    if (rowsToInsert.length > 0) {
      const { error } = await supabase.from("creative_clusters").insert(rowsToInsert);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({ ok: true, count: rowsToInsert.length });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
