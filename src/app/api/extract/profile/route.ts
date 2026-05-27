import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { scrapeProfile } from "@/lib/apify";
import type { Platform } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 180; // Profile scrapes can be slower than single posts

const inputSchema = z.object({
  handle: z.string().min(1, "Handle required"),
  platform: z.enum([
    "instagram",
    "tiktok",
    "youtube",
    "linkedin",
    "meta_ad",
    "other",
  ]),
  count: z.number().int().min(1).max(100).default(20),

  // Tag the scraped posts to one of these (optional, but recommended):
  brand_id: z.string().uuid().nullable().optional(),
  competitor_id: z.string().uuid().nullable().optional(),
  creator_id: z.string().uuid().nullable().optional(),
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
      { error: "Bad input", details: parsed.error.issues },
      { status: 400 }
    );
  }
  const v = parsed.data;

  // If competitor_id / creator_id given, fetch the name to denormalize
  let competitor_name: string | null = null;
  let creator_name: string | null = null;
  if (v.competitor_id) {
    const { data } = await supabase
      .from("competitors")
      .select("name")
      .eq("id", v.competitor_id)
      .eq("owner_id", user.id)
      .maybeSingle();
    competitor_name = data?.name ?? null;
  }
  if (v.creator_id) {
    const { data } = await supabase
      .from("creators")
      .select("name")
      .eq("id", v.creator_id)
      .eq("owner_id", user.id)
      .maybeSingle();
    creator_name = data?.name ?? null;
  }

  // Default brand_id to the active brand if not provided
  let brand_id = v.brand_id ?? null;
  if (!brand_id) {
    const { data: ab } = await supabase
      .from("brands")
      .select("id")
      .eq("owner_id", user.id)
      .eq("is_active", true)
      .maybeSingle();
    brand_id = ab?.id ?? null;
  }

  // Call Apify
  const result = await scrapeProfile(v.handle, v.platform as Platform, v.count);
  if (!result.ok || result.posts.length === 0) {
    return NextResponse.json(
      {
        ok: false,
        error: result.message,
        actor: result.actor,
        platform: result.platform,
      },
      { status: 502 }
    );
  }

  // Bulk insert into content_assets
  const rows = result.posts.map((p) => ({
    owner_id: user.id,
    brand_id,
    competitor_id: v.competitor_id ?? null,
    creator_id: v.creator_id ?? null,
    competitor_name,
    creator_name,
    source_url: p.source_url,
    platform: p.platform,
    content_type: null,
    title: p.title ?? null,
    caption: p.caption ?? null,
    transcript: p.transcript ?? null,
    thumbnail_url: p.thumbnail_url ?? null,
    views: p.metrics?.views ?? null,
    likes: p.metrics?.likes ?? null,
    comments: p.metrics?.comments ?? null,
    shares: p.metrics?.shares ?? null,
    saves: p.metrics?.saves ?? null,
    extraction_status: "extracted",
    extraction_source: "vision", // closest enum match; "apify" isn't in the type union
    extracted_at: new Date().toISOString(),
  }));

  const { data: inserted, error } = await supabase
    .from("content_assets")
    .insert(rows)
    .select("id");

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    count: inserted?.length ?? 0,
    asset_ids: inserted?.map((r) => r.id) ?? [],
    message: result.message,
    actor: result.actor,
  });
}
