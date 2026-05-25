import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { openai, MODELS } from "@/lib/openai";

export const runtime = "nodejs";
export const maxDuration = 60;

const inputSchema = z.object({
  thread_id: z.string().uuid().optional(),
  message: z.string().min(1),
});

interface DnaContext {
  asset_id: string;
  title: string;
  platform: string | null;
  creator_name: string | null;
  competitor_name: string | null;
  hook_style: string | null;
  emotion: string | null;
  content_territory: string | null;
  creative_family: string | null;
  predicted_performance_score: number | null;
  what_is_working: string | null;
  what_is_weak: string | null;
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = inputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Bad input" }, { status: 400 });
  }
  const { message } = parsed.data;
  const threadId = parsed.data.thread_id ?? crypto.randomUUID();

  // Load brand context
  const { data: brand } = await supabase
    .from("brands")
    .select("name, tagline, mission, audience, tone, products, usps")
    .eq("owner_id", user.id)
    .eq("is_active", true)
    .maybeSingle();

  // Load recent DNA context (top 30 by score, then most recent)
  const { data: dnaRows } = await supabase
    .from("creative_dna_reports")
    .select(
      `asset_id, hook_style, emotion, content_territory, creative_family, predicted_performance_score, what_is_working, what_is_weak,
       asset:content_assets(title, platform, creator_name, competitor_name)`
    )
    .eq("owner_id", user.id)
    .order("predicted_performance_score", { ascending: false, nullsFirst: false })
    .limit(30);

  type Joined = {
    asset_id: string;
    hook_style: string | null;
    emotion: string | null;
    content_territory: string | null;
    creative_family: string | null;
    predicted_performance_score: number | null;
    what_is_working: string | null;
    what_is_weak: string | null;
    asset:
      | { title: string | null; platform: string | null; creator_name: string | null; competitor_name: string | null }
      | Array<{ title: string | null; platform: string | null; creator_name: string | null; competitor_name: string | null }>
      | null;
  };
  const ctx: DnaContext[] = ((dnaRows ?? []) as unknown as Joined[]).map((r) => {
    const a = Array.isArray(r.asset) ? r.asset[0] ?? null : r.asset;
    return {
      asset_id: r.asset_id,
      title: a?.title ?? "Untitled",
      platform: a?.platform ?? null,
      creator_name: a?.creator_name ?? null,
      competitor_name: a?.competitor_name ?? null,
      hook_style: r.hook_style,
      emotion: r.emotion,
      content_territory: r.content_territory,
      creative_family: r.creative_family,
      predicted_performance_score: r.predicted_performance_score,
      what_is_working: r.what_is_working,
      what_is_weak: r.what_is_weak,
    };
  });

  // Load prior thread messages
  const { data: priorRows } = await supabase
    .from("ai_chat_messages")
    .select("role, content")
    .eq("owner_id", user.id)
    .eq("thread_id", threadId)
    .order("created_at");

  const sys = `You are CREATAI's AI Analyst — a senior creative strategist who has read every piece of content this operator has analyzed.

You speak directly, with the candor of an in-house CMO. No fluff. Concrete recommendations. Cite specific assets by title when relevant.

When data is sparse:
- Say so explicitly.
- Offer directional guidance based on the brand context and general creative best-practices.
- Recommend what to analyze next so the answer gets sharper.

You always use the operator's actual data when available. You never make up metrics or claim assets you haven't seen.`;

  const contextBlock = buildContext(brand, ctx);
  const messages = [
    { role: "system" as const, content: sys },
    { role: "system" as const, content: contextBlock },
    ...((priorRows ?? []) as Array<{ role: "user" | "assistant" | "system"; content: string }>).map(
      (r) => ({ role: r.role as "user" | "assistant", content: r.content })
    ),
    { role: "user" as const, content: message },
  ];

  try {
    const completion = await openai().chat.completions.create({
      model: MODELS.chat,
      messages,
    });
    const reply = completion.choices[0]?.message?.content?.trim() ?? "";

    // Persist user + assistant messages
    await supabase.from("ai_chat_messages").insert([
      {
        owner_id: user.id,
        brand_id: null,
        thread_id: threadId,
        role: "user",
        content: message,
        model: null,
      },
      {
        owner_id: user.id,
        brand_id: null,
        thread_id: threadId,
        role: "assistant",
        content: reply,
        citations: extractCitations(reply, ctx),
        model: MODELS.chat,
      },
    ]);

    return NextResponse.json({ thread_id: threadId, reply });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown chat error";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}

function buildContext(
  brand: {
    name: string;
    tagline: string | null;
    mission: string | null;
    audience: string | null;
    tone: string | null;
    products: string | null;
    usps: string | null;
  } | null,
  ctx: DnaContext[]
): string {
  const lines: string[] = ["## ACTIVE BRAND"];
  if (brand) {
    lines.push(`Name: ${brand.name}`);
    if (brand.tagline) lines.push(`Tagline: ${brand.tagline}`);
    if (brand.mission) lines.push(`Mission: ${brand.mission}`);
    if (brand.audience) lines.push(`Audience: ${brand.audience}`);
    if (brand.tone) lines.push(`Tone: ${brand.tone}`);
    if (brand.products) lines.push(`Products: ${brand.products}`);
    if (brand.usps) lines.push(`USPs: ${brand.usps}`);
  } else {
    lines.push("(no active brand set)");
  }

  lines.push("");
  lines.push(`## SAVED CREATIVE DNA (${ctx.length} top assets)`);
  if (ctx.length === 0) {
    lines.push(
      "(no content analyzed yet — give directional advice and recommend they analyze 3-5 pieces to get sharper answers)"
    );
  } else {
    for (const c of ctx) {
      lines.push(
        `- ${c.title} [${c.platform ?? "—"}] hook=${c.hook_style ?? "—"} emotion=${c.emotion ?? "—"} territory=${c.content_territory ?? "—"} family=${c.creative_family ?? "—"} score=${c.predicted_performance_score ?? "—"}`
      );
      if (c.what_is_working) lines.push(`    + ${c.what_is_working.slice(0, 240)}`);
      if (c.what_is_weak) lines.push(`    - ${c.what_is_weak.slice(0, 240)}`);
    }
  }
  return lines.join("\n");
}

function extractCitations(
  reply: string,
  ctx: DnaContext[]
): Array<{ asset_id: string; title: string }> {
  const cites: Array<{ asset_id: string; title: string }> = [];
  for (const c of ctx) {
    if (c.title && reply.toLowerCase().includes(c.title.toLowerCase())) {
      cites.push({ asset_id: c.asset_id, title: c.title });
    }
  }
  return cites;
}
