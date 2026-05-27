-- ============================================================
-- CREATAI :: V1.2 — per-platform handles on Brand Profile
-- ============================================================
-- Adds five optional handle columns to brands so users can declare
-- their own social handles and bulk-scrape their own content.

alter table public.brands
  add column if not exists handle_instagram text,
  add column if not exists handle_tiktok text,
  add column if not exists handle_youtube text,
  add column if not exists handle_linkedin text,
  add column if not exists handle_twitter text;
