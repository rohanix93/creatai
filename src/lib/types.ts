/**
 * CREATAI :: shared types
 * Mirrors the Supabase schema in supabase/migrations/001_creatai_v1_schema.sql
 */

export type Platform = "instagram" | "tiktok" | "youtube" | "linkedin" | "meta_ad" | "other";

export type ContentType =
  | "video"
  | "image"
  | "carousel"
  | "story"
  | "ad"
  | "post";

export type ExtractionStatus = "pending" | "extracted" | "failed" | "manual";
export type ExtractionSource = "youtube" | "vision" | "whisper" | "manual";

export interface Brand {
  id: string;
  owner_id: string;
  name: string;
  tagline: string | null;
  mission: string | null;
  audience: string | null;
  tone: string | null;
  products: string | null;
  usps: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Competitor {
  id: string;
  owner_id: string;
  brand_id: string | null;
  name: string;
  platform: Platform | null;
  handle_or_url: string | null;
  category: string | null;
  notes: string | null;
  created_at: string;
}

export interface Creator {
  id: string;
  owner_id: string;
  brand_id: string | null;
  name: string;
  platform: Platform | null;
  handle_or_url: string | null;
  niche: string | null;
  notes: string | null;
  created_at: string;
}

export interface ContentAsset {
  id: string;
  owner_id: string;
  brand_id: string | null;
  source_url: string | null;
  platform: Platform | null;
  content_type: ContentType | null;
  creator_id: string | null;
  competitor_id: string | null;
  title: string | null;
  campaign_name: string | null;
  creator_name: string | null;
  competitor_name: string | null;
  caption: string | null;
  transcript: string | null;
  thumbnail_url: string | null;
  views: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  saves: number | null;
  spend: number | null;
  conversions: number | null;
  notes: string | null;
  extraction_status: ExtractionStatus;
  extraction_source: ExtractionSource | null;
  extracted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreativeDnaReport {
  id: string;
  asset_id: string;
  owner_id: string;
  hook_style: string | null;
  content_type: string | null;
  format: string | null;
  tone: string | null;
  emotion: string | null;
  visual_style: string | null;
  cta_quality: string | null;
  content_territory: string | null;
  audience_stage: string | null;
  product_role: string | null;
  psychological_trigger: string | null;
  brand_presence: string | null;
  creator_presence: string | null;
  storytelling_structure: string | null;
  creative_family: string | null;
  predicted_performance_score: number | null;
  hook_score: number | null;
  retention_score: number | null;
  engagement_score: number | null;
  conversion_score: number | null;
  novelty_score: number | null;
  what_is_working: string | null;
  what_is_weak: string | null;
  what_to_improve: string | null;
  content_ideas: string[] | null;
  model: string;
  raw_response: unknown;
  created_at: string;
}

export interface CreativeCluster {
  id: string;
  owner_id: string;
  brand_id: string | null;
  name: string;
  description: string | null;
  common_hook_style: string | null;
  common_emotion: string | null;
  common_territory: string | null;
  avg_performance_score: number | null;
  asset_count: number;
  why_it_matters: string | null;
  recommended_next_move: string | null;
  asset_ids: string[];
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  owner_id: string;
  brand_id: string | null;
  thread_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  citations: Array<{ asset_id: string; title: string }> | null;
  model: string | null;
  created_at: string;
}
