/**
 * CREATAI :: Brand DNA synthesis
 *
 * Given a brand profile + all the pulled assets for that brand, produces
 * a structured 5-part report:
 *   1. DIAGNOSE  — niche, summary, strengths, areas to improve
 *   2. PAIN      — specific underperforming posts + why
 *   3. GROWTH    — virality score + 30-day growth curve projection
 *   4. ASPIRATION— target follower count + target date
 *   5. PLAN      — recommended hooks, content ideas, posting cadence
 *
 * Inspired by competitor onboarding flows; structurally a "brand-level DNA"
 * report that aggregates patterns across the user's pulled content.
 */

import { z } from "zod";
import { openai, MODELS } from "./openai";
import type { Brand, ContentAsset } from "./types";

export const brandDnaSchema = z.object({
  niche: z.string(),
  summary: z.string(),
  audience_tags: z.array(z.string()).min(3).max(8),

  strengths: z
    .array(z.object({ title: z.string(), evidence: z.string() }))
    .min(3)
    .max(5),
  areas_to_improve: z
    .array(
      z.object({
        title: z.string(),
        evidence: z.string(),
        fix: z.string(),
      })
    )
    .min(3)
    .max(5),

  underperformers: z
    .array(
      z.object({
        asset_id: z.string(),
        title: z.string(),
        views: z.number().nullable(),
        reason: z.string(),
      })
    )
    .max(3),

  virality_score: z.number().int().min(0).max(100),
  growth_multiplier: z.number().min(1).max(50),
  growth_curve: z
    .array(z.object({ day: z.number(), multiplier: z.number() }))
    .min(2)
    .max(6),

  target_followers: z.number().int().positive(),
  target_date: z.string(), // ISO date (YYYY-MM-DD)
  aspiration_statement: z.string(),

  recommended_hooks: z.array(z.string()).min(3).max(7),
  content_ideas: z
    .array(
      z.object({
        title: z.string(),
        hook: z.string(),
        format: z.string(),
        why: z.string(),
      })
    )
    .min(3)
    .max(7),
  posting_cadence: z.string(),
});

export type BrandDnaPayload = z.infer<typeof brandDnaSchema>;

export interface BrandDnaInput {
  brand: Pick<
    Brand,
    | "name"
    | "tagline"
    | "mission"
    | "audience"
    | "tone"
    | "products"
    | "usps"
    | "handle_instagram"
    | "handle_tiktok"
    | "handle_youtube"
    | "handle_linkedin"
    | "handle_twitter"
  >;
  assets: Array<
    Pick<
      ContentAsset,
      | "id"
      | "title"
      | "platform"
      | "content_type"
      | "caption"
      | "views"
      | "likes"
      | "comments"
      | "shares"
      | "saves"
      | "created_at"
    >
  >;
}

const jsonSchema = {
  name: "BrandDnaReport",
  schema: {
    type: "object",
    properties: {
      niche: { type: "string" },
      summary: { type: "string" },
      audience_tags: { type: "array", items: { type: "string" } },
      strengths: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            evidence: { type: "string" },
          },
          required: ["title", "evidence"],
          additionalProperties: false,
        },
      },
      areas_to_improve: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            evidence: { type: "string" },
            fix: { type: "string" },
          },
          required: ["title", "evidence", "fix"],
          additionalProperties: false,
        },
      },
      underperformers: {
        type: "array",
        items: {
          type: "object",
          properties: {
            asset_id: { type: "string" },
            title: { type: "string" },
            views: { type: ["number", "null"] },
            reason: { type: "string" },
          },
          required: ["asset_id", "title", "views", "reason"],
          additionalProperties: false,
        },
      },
      virality_score: { type: "integer", minimum: 0, maximum: 100 },
      growth_multiplier: { type: "number", minimum: 1, maximum: 50 },
      growth_curve: {
        type: "array",
        items: {
          type: "object",
          properties: {
            day: { type: "integer" },
            multiplier: { type: "number" },
          },
          required: ["day", "multiplier"],
          additionalProperties: false,
        },
      },
      target_followers: { type: "integer", minimum: 1 },
      target_date: { type: "string" },
      aspiration_statement: { type: "string" },
      recommended_hooks: { type: "array", items: { type: "string" } },
      content_ideas: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            hook: { type: "string" },
            format: { type: "string" },
            why: { type: "string" },
          },
          required: ["title", "hook", "format", "why"],
          additionalProperties: false,
        },
      },
      posting_cadence: { type: "string" },
    },
    required: [
      "niche",
      "summary",
      "audience_tags",
      "strengths",
      "areas_to_improve",
      "underperformers",
      "virality_score",
      "growth_multiplier",
      "growth_curve",
      "target_followers",
      "target_date",
      "aspiration_statement",
      "recommended_hooks",
      "content_ideas",
      "posting_cadence",
    ],
    additionalProperties: false,
  },
  strict: true,
} as const;

function buildSystem() {
  return `You are CREATAI's senior strategy partner. The operator has connected handles and pulled their content into our library. Your job is to read the brand context + the assets and produce a structured brand-level DNA report — the kind a senior consultant would deliver after a week of analysis.

Tone: direct, candid, evidence-based. Reference specific posts when claiming patterns. No fluff.

Structure (you MUST output every field):
  niche                — short label (3-6 words) for the operator's category
  summary              — 4-6 sentence narrative. Cover what's working, the dominant pattern, the gap holding them back, the unlock available. Quote specific view counts and titles when you can.
  audience_tags        — 3-8 hashtag-style topic tags
  strengths            — 3-5 things they're proven good at, each with one-sentence evidence from the data
  areas_to_improve     — 3-5 specific weaknesses, each with evidence + a concrete fix
  underperformers      — up to 3 specific assets that underperformed; cite asset_id and explain why
  virality_score       — 0-100, honest assessment based on actual metrics + content quality
  growth_multiplier    — projected uplift if they follow the plan (e.g. 4.5)
  growth_curve         — 30-day curve as [{day, multiplier}] — typically 4-6 points from day 1 to day 30
  target_followers     — aspirational integer follower count if plan executes
  target_date          — ISO date (YYYY-MM-DD) 6-12 months out from today for the target_followers
  aspiration_statement — 1-2 sentences of the bold vision
  recommended_hooks    — 3-7 hook templates that fit this operator's voice
  content_ideas        — 3-7 specific ideas, each with {title, hook, format, why}
  posting_cadence      — recommended rhythm (e.g. "3-4 posts/week, mix of carousel + reel")

Numbers must be plausible and grounded in the data shown.`;
}

function buildUser(input: BrandDnaInput) {
  const lines: string[] = [];
  lines.push("## BRAND CONTEXT");
  lines.push(`Name: ${input.brand.name}`);
  if (input.brand.tagline) lines.push(`Tagline: ${input.brand.tagline}`);
  if (input.brand.mission) lines.push(`Mission: ${input.brand.mission}`);
  if (input.brand.audience) lines.push(`Audience: ${input.brand.audience}`);
  if (input.brand.tone) lines.push(`Tone: ${input.brand.tone}`);
  if (input.brand.products) lines.push(`Products: ${input.brand.products}`);
  if (input.brand.usps) lines.push(`USPs: ${input.brand.usps}`);

  const handles: string[] = [];
  if (input.brand.handle_instagram) handles.push(`IG: ${input.brand.handle_instagram}`);
  if (input.brand.handle_tiktok)    handles.push(`TT: ${input.brand.handle_tiktok}`);
  if (input.brand.handle_youtube)   handles.push(`YT: ${input.brand.handle_youtube}`);
  if (input.brand.handle_linkedin)  handles.push(`LI: ${input.brand.handle_linkedin}`);
  if (input.brand.handle_twitter)   handles.push(`X:  ${input.brand.handle_twitter}`);
  if (handles.length) lines.push(`Handles: ${handles.join(", ")}`);

  lines.push("");
  lines.push(`## CONTENT CATALOG (${input.assets.length} assets)`);
  lines.push("Each row is: id | platform | views | likes | comments | shares | title | caption_preview");
  for (const a of input.assets.slice(0, 60)) {
    const captionPreview = (a.caption ?? "").slice(0, 140).replace(/\s+/g, " ");
    lines.push(
      `${a.id} | ${a.platform ?? "?"} | ${a.views ?? "-"}v | ${a.likes ?? "-"}l | ${a.comments ?? "-"}c | ${a.shares ?? "-"}s | ${a.title ?? "Untitled"} | ${captionPreview}`
    );
  }

  lines.push("");
  lines.push(
    "Today's date is " + new Date().toISOString().slice(0, 10) + ". Choose target_date 6-12 months from today."
  );
  lines.push("Produce the report.");
  return lines.join("\n");
}

export async function generateBrandDna(
  input: BrandDnaInput
): Promise<{ data: BrandDnaPayload | null; raw: unknown; error?: string }> {
  try {
    const completion = await openai().chat.completions.create({
      model: MODELS.analysis,
      messages: [
        { role: "system", content: buildSystem() },
        { role: "user", content: buildUser(input) },
      ],
      response_format: {
        type: "json_schema",
        json_schema: jsonSchema,
      },
    });
    const raw = completion.choices[0]?.message?.content ?? "";
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return { data: null, raw, error: "Model did not return valid JSON" };
    }
    const v = brandDnaSchema.safeParse(parsed);
    if (!v.success) {
      return {
        data: null,
        raw: parsed,
        error: `Schema validation failed: ${v.error.message.slice(0, 240)}`,
      };
    }
    return { data: v.data, raw: parsed };
  } catch (err) {
    return {
      data: null,
      raw: null,
      error: err instanceof Error ? err.message : "OpenAI error",
    };
  }
}
