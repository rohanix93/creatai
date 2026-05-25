/**
 * CREATAI :: Creative DNA generation
 *
 * Takes raw content (transcript/caption/thumbnail) + brand context and produces
 * a structured 22-attribute Creative DNA report using GPT-4o.
 */

import { openai, MODELS } from "./openai";
import { z } from "zod";
import type { Brand, CreativeDnaReport } from "./types";

export const dnaSchema = z.object({
  hook_style: z.string(),
  content_type: z.string(),
  format: z.string(),
  tone: z.string(),
  emotion: z.string(),
  visual_style: z.string(),
  cta_quality: z.string(),
  content_territory: z.string(),
  audience_stage: z.string(),
  product_role: z.string(),
  psychological_trigger: z.string(),
  brand_presence: z.string(),
  creator_presence: z.string(),
  storytelling_structure: z.string(),
  creative_family: z.string(),

  predicted_performance_score: z.number().min(0).max(100),
  hook_score: z.number().min(0).max(100),
  retention_score: z.number().min(0).max(100),
  engagement_score: z.number().min(0).max(100),
  conversion_score: z.number().min(0).max(100),
  novelty_score: z.number().min(0).max(100),

  what_is_working: z.string(),
  what_is_weak: z.string(),
  what_to_improve: z.string(),
  content_ideas: z.array(z.string()).min(3).max(7),
});

export type DnaPayload = z.infer<typeof dnaSchema>;

export interface DnaInput {
  brand?: Pick<Brand, "name" | "tagline" | "mission" | "audience" | "tone" | "products" | "usps"> | null;
  platform?: string | null;
  content_type?: string | null;
  source_url?: string | null;
  title?: string | null;
  caption?: string | null;
  transcript?: string | null;
  creator_name?: string | null;
  competitor_name?: string | null;
  thumbnail_url?: string | null;
  metrics?: {
    views?: number | null;
    likes?: number | null;
    comments?: number | null;
    shares?: number | null;
    saves?: number | null;
    spend?: number | null;
    conversions?: number | null;
  };
  notes?: string | null;
}

function buildSystemPrompt() {
  return `You are CREATAI's senior creative strategist. Given a piece of content, you produce a precise, structured Creative DNA report — the kind a top-tier brand director would write.

Rules:
- Use lowercase snake_case-ish phrases for categorical attributes (e.g. "founder_confession", "contrarian_callout", "ugc_proof").
- Scores are integers 0-100 reflecting your honest assessment.
- "creative_family" is a short, memorable family name in PascalCase or Title Case (e.g. "Founder Confession Stories", "Money Mistake Explainers", "UGC Product Proof"). Reuse common families when they fit.
- "what_is_working", "what_is_weak", "what_to_improve" — 2-4 sentences each, direct.
- "content_ideas" — 5 specific, executable next pieces this brand should make.
- If data is sparse, infer thoughtfully but never invent metrics or claims about the creator. Say so when uncertain.
- Output strictly the JSON schema you are given. No prose.`;
}

function buildUserPrompt(input: DnaInput) {
  const lines: string[] = [];

  if (input.brand) {
    lines.push("## BRAND CONTEXT");
    lines.push(`Name: ${input.brand.name}`);
    if (input.brand.tagline) lines.push(`Tagline: ${input.brand.tagline}`);
    if (input.brand.mission) lines.push(`Mission: ${input.brand.mission}`);
    if (input.brand.audience) lines.push(`Audience: ${input.brand.audience}`);
    if (input.brand.tone) lines.push(`Tone: ${input.brand.tone}`);
    if (input.brand.products) lines.push(`Products: ${input.brand.products}`);
    if (input.brand.usps) lines.push(`USPs: ${input.brand.usps}`);
    lines.push("");
  }

  lines.push("## CONTENT TO ANALYZE");
  if (input.platform) lines.push(`Platform: ${input.platform}`);
  if (input.content_type) lines.push(`Content type: ${input.content_type}`);
  if (input.creator_name) lines.push(`Creator: ${input.creator_name}`);
  if (input.competitor_name) lines.push(`Competitor: ${input.competitor_name}`);
  if (input.source_url) lines.push(`Source URL: ${input.source_url}`);
  if (input.title) lines.push(`Title: ${input.title}`);
  if (input.caption) lines.push(`Caption:\n${input.caption}`);
  if (input.transcript) lines.push(`Transcript / on-screen text:\n${input.transcript}`);

  const m = input.metrics;
  if (
    m &&
    (m.views != null ||
      m.likes != null ||
      m.comments != null ||
      m.shares != null ||
      m.saves != null ||
      m.spend != null ||
      m.conversions != null)
  ) {
    lines.push("");
    lines.push("## PERFORMANCE METRICS (manual)");
    const fields: Array<[keyof typeof m, string]> = [
      ["views", "views"],
      ["likes", "likes"],
      ["comments", "comments"],
      ["shares", "shares"],
      ["saves", "saves"],
      ["spend", "spend"],
      ["conversions", "conversions"],
    ];
    for (const [k, label] of fields) {
      if (m[k] != null) lines.push(`${label}: ${m[k]}`);
    }
  }

  if (input.notes) {
    lines.push("");
    lines.push(`## NOTES\n${input.notes}`);
  }

  lines.push("");
  lines.push("Produce the Creative DNA report.");
  return lines.join("\n");
}

const dnaJsonSchema = {
  name: "CreativeDnaReport",
  schema: {
    type: "object",
    properties: {
      hook_style: { type: "string" },
      content_type: { type: "string" },
      format: { type: "string" },
      tone: { type: "string" },
      emotion: { type: "string" },
      visual_style: { type: "string" },
      cta_quality: { type: "string" },
      content_territory: { type: "string" },
      audience_stage: { type: "string" },
      product_role: { type: "string" },
      psychological_trigger: { type: "string" },
      brand_presence: { type: "string" },
      creator_presence: { type: "string" },
      storytelling_structure: { type: "string" },
      creative_family: { type: "string" },
      predicted_performance_score: { type: "integer", minimum: 0, maximum: 100 },
      hook_score: { type: "integer", minimum: 0, maximum: 100 },
      retention_score: { type: "integer", minimum: 0, maximum: 100 },
      engagement_score: { type: "integer", minimum: 0, maximum: 100 },
      conversion_score: { type: "integer", minimum: 0, maximum: 100 },
      novelty_score: { type: "integer", minimum: 0, maximum: 100 },
      what_is_working: { type: "string" },
      what_is_weak: { type: "string" },
      what_to_improve: { type: "string" },
      content_ideas: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 7 },
    },
    required: [
      "hook_style",
      "content_type",
      "format",
      "tone",
      "emotion",
      "visual_style",
      "cta_quality",
      "content_territory",
      "audience_stage",
      "product_role",
      "psychological_trigger",
      "brand_presence",
      "creator_presence",
      "storytelling_structure",
      "creative_family",
      "predicted_performance_score",
      "hook_score",
      "retention_score",
      "engagement_score",
      "conversion_score",
      "novelty_score",
      "what_is_working",
      "what_is_weak",
      "what_to_improve",
      "content_ideas",
    ],
    additionalProperties: false,
  },
  strict: true,
} as const;

export async function generateDna(input: DnaInput): Promise<{
  data: DnaPayload | null;
  raw: unknown;
  error?: string;
}> {
  const sys = buildSystemPrompt();
  const usr = buildUserPrompt(input);

  // If we have an image and no transcript, attach it as vision input alongside text.
  const userContent: OpenAIUserContent[] = [{ type: "text", text: usr }];
  if (input.thumbnail_url && !input.transcript) {
    userContent.push({ type: "image_url", image_url: { url: input.thumbnail_url } });
  }

  try {
    const completion = await openai().chat.completions.create({
      model: MODELS.analysis,
      messages: [
        { role: "system", content: sys },
        { role: "user", content: userContent as OpenAIUserContent[] },
      ],
      response_format: {
        type: "json_schema",
        json_schema: dnaJsonSchema,
      },
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return { data: null, raw, error: "Model did not return valid JSON" };
    }

    const v = dnaSchema.safeParse(parsed);
    if (!v.success) {
      return { data: null, raw, error: `Schema validation failed: ${v.error.message}` };
    }
    return { data: v.data, raw: parsed };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown OpenAI error";
    return { data: null, raw: null, error: msg };
  }
}

type OpenAIUserContent =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

export function toDbRow(
  payload: DnaPayload,
  meta: { asset_id: string; owner_id: string; model: string; raw: unknown }
): Omit<CreativeDnaReport, "id" | "created_at"> {
  return {
    asset_id: meta.asset_id,
    owner_id: meta.owner_id,
    hook_style: payload.hook_style,
    content_type: payload.content_type,
    format: payload.format,
    tone: payload.tone,
    emotion: payload.emotion,
    visual_style: payload.visual_style,
    cta_quality: payload.cta_quality,
    content_territory: payload.content_territory,
    audience_stage: payload.audience_stage,
    product_role: payload.product_role,
    psychological_trigger: payload.psychological_trigger,
    brand_presence: payload.brand_presence,
    creator_presence: payload.creator_presence,
    storytelling_structure: payload.storytelling_structure,
    creative_family: payload.creative_family,
    predicted_performance_score: payload.predicted_performance_score,
    hook_score: payload.hook_score,
    retention_score: payload.retention_score,
    engagement_score: payload.engagement_score,
    conversion_score: payload.conversion_score,
    novelty_score: payload.novelty_score,
    what_is_working: payload.what_is_working,
    what_is_weak: payload.what_is_weak,
    what_to_improve: payload.what_to_improve,
    content_ideas: payload.content_ideas,
    model: meta.model,
    raw_response: meta.raw,
  };
}
