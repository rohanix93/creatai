import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { generateDna, toDbRow } from "@/lib/dna";
import { MODELS } from "@/lib/openai";
import type { Platform, ContentType } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60; // seconds

const inputSchema = z.object({
  brand_id: z.string().uuid().nullable().optional(),
  platform: z.string().optional().nullable(),
  content_type: z.string().optional().nullable(),
  source_url: z.string().optional().nullable(),
  title: z.string().optional().nullable(),
  campaign_name: z.string().optional().nullable(),
  creator_name: z.string().optional().nullable(),
  competitor_name: z.string().optional().nullable(),
  caption: z.string().optional().nullable(),
  transcript: z.string().optional().nullable(),
  thumbnail_url: z.string().optional().nullable(),
  views: z.number().optional().nullable(),
  likes: z.number().optional().nullable(),
  comments: z.number().optional().nullable(),
  shares: z.number().optional().nullable(),
  saves: z.number().optional().nullable(),
  spend: z.number().optional().nullable(),
  conversions: z.number().optional().nullable(),
  notes: z.string().optional().nullable(),
  extraction_status: z.string().optional().nullable(),
  extraction_source: z.string().optional().nullable(),
});

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = inputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.issues },
      { status: 400 }
    );
  }
  const v = parsed.data;

  // Require at least caption or transcript or source_url
  if (!v.caption && !v.transcript && !v.source_url && !v.thumbnail_url) {
    return NextResponse.json(
      { error: "Provide at least a URL, caption, transcript, or image to analyze." },
      { status: 400 }
    );
  }

  // Load brand context (if any)
  let brand = null;
  if (v.brand_id) {
    const { data: b } = await supabase
      .from("brands")
      .select("name, tagline, mission, audience, tone, products, usps")
      .eq("id", v.brand_id)
      .eq("owner_id", user.id)
      .single();
    brand = b ?? null;
  } else {
    // Fall back to active brand
    const { data: b } = await supabase
      .from("brands")
      .select("id, name, tagline, mission, audience, tone, products, usps")
      .eq("owner_id", user.id)
      .eq("is_active", true)
      .maybeSingle();
    brand = b ?? null;
    if (b?.id) v.brand_id = b.id;
  }

  // 1) Insert content_asset row
  const { data: asset, error: assetErr } = await supabase
    .from("content_assets")
    .insert({
      owner_id: user.id,
      brand_id: v.brand_id ?? null,
      source_url: v.source_url ?? null,
      platform: (v.platform as Platform) ?? null,
      content_type: (v.content_type as ContentType) ?? null,
      title: v.title ?? null,
      campaign_name: v.campaign_name ?? null,
      creator_name: v.creator_name ?? null,
      competitor_name: v.competitor_name ?? null,
      caption: v.caption ?? null,
      transcript: v.transcript ?? null,
      thumbnail_url: v.thumbnail_url ?? null,
      views: v.views ?? null,
      likes: v.likes ?? null,
      comments: v.comments ?? null,
      shares: v.shares ?? null,
      saves: v.saves ?? null,
      spend: v.spend ?? null,
      conversions: v.conversions ?? null,
      notes: v.notes ?? null,
      extraction_status: (v.extraction_status as "extracted" | "manual" | "pending") ?? "manual",
      extraction_source: (v.extraction_source as "youtube" | "vision" | "whisper" | "manual" | null) ?? "manual",
      extracted_at: v.extraction_source ? new Date().toISOString() : null,
    })
    .select("*")
    .single();

  if (assetErr || !asset) {
    return NextResponse.json(
      { error: assetErr?.message ?? "Could not save content asset" },
      { status: 500 }
    );
  }

  // 2) Generate DNA
  const dna = await generateDna({
    brand,
    platform: v.platform,
    content_type: v.content_type,
    source_url: v.source_url,
    title: v.title,
    caption: v.caption,
    transcript: v.transcript,
    creator_name: v.creator_name,
    competitor_name: v.competitor_name,
    thumbnail_url: v.thumbnail_url,
    metrics: {
      views: v.views,
      likes: v.likes,
      comments: v.comments,
      shares: v.shares,
      saves: v.saves,
      spend: v.spend,
      conversions: v.conversions,
    },
    notes: v.notes,
  });

  if (!dna.data) {
    // Best-effort: keep the asset, return error
    return NextResponse.json(
      { error: dna.error ?? "Analysis failed", asset_id: asset.id },
      { status: 502 }
    );
  }

  // 3) Insert DNA report
  const row = toDbRow(dna.data, {
    asset_id: asset.id,
    owner_id: user.id,
    model: MODELS.analysis,
    raw: dna.raw,
  });

  const { error: dnaErr } = await supabase
    .from("creative_dna_reports")
    .insert(row);
  if (dnaErr) {
    return NextResponse.json(
      { error: dnaErr.message, asset_id: asset.id },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, asset_id: asset.id, dna: dna.data });
}
