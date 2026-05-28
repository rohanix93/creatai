import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateBrandDna } from "@/lib/brand-dna";
import { MODELS } from "@/lib/openai";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Load brand
  const { data: brand, error: brandErr } = await supabase
    .from("brands")
    .select("*")
    .eq("id", id)
    .eq("owner_id", user.id)
    .single();
  if (brandErr || !brand) {
    return NextResponse.json({ error: "Brand not found" }, { status: 404 });
  }

  // Load all assets for this brand
  const { data: assets } = await supabase
    .from("content_assets")
    .select(
      "id, title, platform, content_type, caption, views, likes, comments, shares, saves, created_at"
    )
    .eq("owner_id", user.id)
    .eq("brand_id", id)
    .order("created_at", { ascending: false })
    .limit(100);

  const list = assets ?? [];
  if (list.length < 3) {
    return NextResponse.json(
      {
        ok: false,
        error: `Need at least 3 assets pulled into this brand before generating its DNA. You have ${list.length}. Add handles to your brand profile and click "↓ pull" to scrape your content.`,
      },
      { status: 400 }
    );
  }

  // Generate
  const result = await generateBrandDna({ brand, assets: list });
  if (!result.data) {
    return NextResponse.json(
      { ok: false, error: result.error ?? "Generation failed" },
      { status: 502 }
    );
  }
  const d = result.data;

  // Persist
  const { data: inserted, error: insErr } = await supabase
    .from("brand_analyses")
    .insert({
      owner_id: user.id,
      brand_id: id,
      niche: d.niche,
      summary: d.summary,
      audience_tags: d.audience_tags,
      strengths: d.strengths,
      areas_to_improve: d.areas_to_improve,
      underperformers: d.underperformers,
      virality_score: d.virality_score,
      growth_multiplier: d.growth_multiplier,
      growth_curve: d.growth_curve,
      target_followers: d.target_followers,
      target_date: d.target_date,
      aspiration_statement: d.aspiration_statement,
      recommended_hooks: d.recommended_hooks,
      content_ideas: d.content_ideas,
      posting_cadence: d.posting_cadence,
      asset_count_at_analysis: list.length,
      model: MODELS.analysis,
      raw_response: result.raw,
    })
    .select("id")
    .single();

  if (insErr) {
    return NextResponse.json({ ok: false, error: insErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, analysis_id: inserted?.id });
}
