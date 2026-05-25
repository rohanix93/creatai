/**
 * CREATAI :: Apify scraping wrapper
 *
 * Apify hosts ready-made scrapers ("actors") for every major platform.
 * We pick one actor per platform and call them via the run-sync endpoint
 * which executes the actor and returns dataset items in one HTTP call.
 *
 * Docs: https://docs.apify.com/api/v2/act-runs-sync-get-dataset-items-post
 *
 * Pricing: each actor charges by usage; most are ~$0.001-0.05 per URL.
 * Free tier: $5/mo credits — covers ~hundreds of scrapes for testing.
 */

import type { Platform } from "./types";

const APIFY_BASE = "https://api.apify.com/v2";

export interface ApifyScrapeResult {
  ok: boolean;
  source: "apify";
  actor: string;
  platform: Platform;
  title?: string;
  caption?: string;
  transcript?: string;
  thumbnail_url?: string;
  source_url: string;
  raw?: unknown;
  message: string;
}

/**
 * Actor IDs chosen per platform. Each is a public Apify actor that takes
 * an input URL and returns structured data. Swap these if costs/quality change.
 */
const ACTORS = {
  tiktok:    "clockworks/free-tiktok-scraper",
  instagram: "apify/instagram-scraper",
  linkedin:  "apimaestro/linkedin-profile-posts",
  twitter:   "apidojo/tweet-scraper",
  youtube:   "streamers/youtube-scraper",
} as const;

function token() {
  const t = process.env.APIFY_TOKEN;
  if (!t) {
    throw new Error(
      "APIFY_TOKEN env var not set — required for auto-extraction of non-YouTube platforms"
    );
  }
  return t;
}

async function runActor(
  actorId: string,
  input: unknown,
  timeoutSec = 90
): Promise<unknown[]> {
  // run-sync-get-dataset-items: blocks until the actor finishes (or times out),
  // then returns the result as JSON.
  const url = `${APIFY_BASE}/acts/${actorId.replace(
    "/",
    "~"
  )}/run-sync-get-dataset-items?token=${token()}&timeout=${timeoutSec}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Apify actor ${actorId} failed (${res.status}): ${text.slice(0, 240)}`
    );
  }

  const data = await res.json();
  return Array.isArray(data) ? data : [data];
}

// ────────────────────────────────────────────────────────────────────────────
// Platform-specific normalizers
// ────────────────────────────────────────────────────────────────────────────

interface TikTokRow {
  text?: string;
  videoMeta?: { coverUrl?: string };
  webVideoUrl?: string;
  authorMeta?: { name?: string };
  diggCount?: number;
  playCount?: number;
  commentCount?: number;
  shareCount?: number;
  collectCount?: number;
  videoUrl?: string;
}

interface IgRow {
  caption?: string;
  displayUrl?: string;
  videoUrl?: string;
  ownerUsername?: string;
  shortCode?: string;
  type?: string;
  likesCount?: number;
  commentsCount?: number;
  videoViewCount?: number;
}

interface LinkedInRow {
  text?: string;
  postUrl?: string;
  authorName?: string;
  imageUrl?: string;
  likes?: number;
  comments?: number;
}

interface TwitterRow {
  text?: string;
  fullText?: string;
  author?: { userName?: string };
  url?: string;
  mediaUrl?: string;
  likeCount?: number;
  retweetCount?: number;
  replyCount?: number;
  viewCount?: number;
}

interface YouTubeRow {
  title?: string;
  text?: string;
  description?: string;
  subtitles?: Array<{ srt?: string; plaintext?: string; text?: string }> | string;
  transcript?: string | Array<{ text?: string }>;
  thumbnailUrl?: string;
  thumbnail?: string;
  channelName?: string;
  url?: string;
  duration?: string;
}

export async function scrapeTikTok(url: string): Promise<ApifyScrapeResult> {
  try {
    const rows = (await runActor(ACTORS.tiktok, {
      postURLs: [url],
      resultsPerPage: 1,
      shouldDownloadVideos: false,
      shouldDownloadCovers: false,
    })) as TikTokRow[];
    const r = rows[0];
    if (!r) throw new Error("No data returned from TikTok actor");
    return {
      ok: true,
      source: "apify",
      actor: ACTORS.tiktok,
      platform: "tiktok",
      title: r.authorMeta?.name ? `@${r.authorMeta.name}` : undefined,
      caption: r.text,
      thumbnail_url: r.videoMeta?.coverUrl,
      source_url: url,
      raw: r,
      message: "TikTok content extracted via Apify.",
    };
  } catch (err) {
    return {
      ok: false,
      source: "apify",
      actor: ACTORS.tiktok,
      platform: "tiktok",
      source_url: url,
      message: err instanceof Error ? err.message : "TikTok scrape failed",
    };
  }
}

export async function scrapeInstagram(url: string): Promise<ApifyScrapeResult> {
  try {
    const rows = (await runActor(ACTORS.instagram, {
      directUrls: [url],
      resultsType: "posts",
      resultsLimit: 1,
      addParentData: false,
    })) as IgRow[];
    const r = rows[0];
    if (!r) throw new Error("No data returned from Instagram actor");
    return {
      ok: true,
      source: "apify",
      actor: ACTORS.instagram,
      platform: "instagram",
      title: r.ownerUsername ? `@${r.ownerUsername}` : undefined,
      caption: r.caption,
      thumbnail_url: r.displayUrl,
      source_url: url,
      raw: r,
      message: "Instagram content extracted via Apify.",
    };
  } catch (err) {
    return {
      ok: false,
      source: "apify",
      actor: ACTORS.instagram,
      platform: "instagram",
      source_url: url,
      message: err instanceof Error ? err.message : "Instagram scrape failed",
    };
  }
}

export async function scrapeLinkedIn(url: string): Promise<ApifyScrapeResult> {
  try {
    const rows = (await runActor(ACTORS.linkedin, {
      urls: [url],
      maxPosts: 1,
    })) as LinkedInRow[];
    const r = rows[0];
    if (!r) throw new Error("No data returned from LinkedIn actor");
    return {
      ok: true,
      source: "apify",
      actor: ACTORS.linkedin,
      platform: "linkedin",
      title: r.authorName,
      caption: r.text,
      thumbnail_url: r.imageUrl,
      source_url: url,
      raw: r,
      message: "LinkedIn post extracted via Apify.",
    };
  } catch (err) {
    return {
      ok: false,
      source: "apify",
      actor: ACTORS.linkedin,
      platform: "linkedin",
      source_url: url,
      message: err instanceof Error ? err.message : "LinkedIn scrape failed",
    };
  }
}

export async function scrapeYouTube(url: string): Promise<ApifyScrapeResult> {
  try {
    const rows = (await runActor(
      ACTORS.youtube,
      {
        startUrls: [{ url }],
        maxResults: 1,
        maxResultsShorts: 1,
        subtitlesLanguage: "en",
        downloadSubtitles: true,
      },
      120 // YouTube actors are slower
    )) as YouTubeRow[];
    const r = rows[0];
    if (!r) throw new Error("No data returned from YouTube actor");

    // Normalize transcript — different actor versions return different shapes
    let transcript: string | undefined;
    if (typeof r.transcript === "string") {
      transcript = r.transcript;
    } else if (Array.isArray(r.transcript)) {
      transcript = r.transcript.map((s) => s.text ?? "").filter(Boolean).join(" ");
    }
    if (!transcript && r.subtitles) {
      if (typeof r.subtitles === "string") {
        transcript = r.subtitles;
      } else if (Array.isArray(r.subtitles)) {
        transcript = r.subtitles
          .map((s) => s.plaintext ?? s.text ?? s.srt ?? "")
          .filter(Boolean)
          .join(" ");
      }
    }
    if (!transcript && r.text) transcript = r.text;

    return {
      ok: true,
      source: "apify",
      actor: ACTORS.youtube,
      platform: "youtube",
      title: r.title ?? (r.channelName ? `${r.channelName}` : undefined),
      caption: r.description,
      transcript,
      thumbnail_url: r.thumbnailUrl ?? r.thumbnail,
      source_url: url,
      raw: r,
      message: transcript
        ? "YouTube content + transcript extracted via Apify."
        : "YouTube metadata extracted via Apify (no captions found).",
    };
  } catch (err) {
    return {
      ok: false,
      source: "apify",
      actor: ACTORS.youtube,
      platform: "youtube",
      source_url: url,
      message: err instanceof Error ? err.message : "YouTube scrape failed",
    };
  }
}

export async function scrapeTwitter(url: string): Promise<ApifyScrapeResult> {
  try {
    const rows = (await runActor(ACTORS.twitter, {
      tweetUrls: [url],
      maxItems: 1,
    })) as TwitterRow[];
    const r = rows[0];
    if (!r) throw new Error("No data returned from Twitter actor");
    return {
      ok: true,
      source: "apify",
      actor: ACTORS.twitter,
      platform: "other",
      title: r.author?.userName ? `@${r.author.userName}` : undefined,
      caption: r.fullText ?? r.text,
      thumbnail_url: r.mediaUrl,
      source_url: url,
      raw: r,
      message: "Tweet extracted via Apify.",
    };
  } catch (err) {
    return {
      ok: false,
      source: "apify",
      actor: ACTORS.twitter,
      platform: "other",
      source_url: url,
      message: err instanceof Error ? err.message : "Twitter scrape failed",
    };
  }
}

/**
 * Dispatch by platform — used by /api/extract.
 */
export async function scrapeViaApify(
  url: string,
  platform: Platform
): Promise<ApifyScrapeResult | null> {
  if (!process.env.APIFY_TOKEN) return null;

  switch (platform) {
    case "tiktok":
      return scrapeTikTok(url);
    case "instagram":
      return scrapeInstagram(url);
    case "linkedin":
      return scrapeLinkedIn(url);
    case "youtube":
      return scrapeYouTube(url);
    default:
      // Twitter/X URLs come through as "other"
      if (/(twitter\.com|x\.com)\//i.test(url)) return scrapeTwitter(url);
      return null;
  }
}
