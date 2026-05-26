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

export interface ScrapedMetrics {
  views?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  saves?: number;
}

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
  metrics?: ScrapedMetrics;
  raw?: unknown;
  message: string;
}

/**
 * Actor IDs chosen per platform. Each is a public Apify actor that takes
 * an input URL and returns structured data. Swap these if costs/quality change.
 */
/**
 * Default actor IDs. Each is overridable via env var so you can swap actors
 * (or paste an actor ID directly into Vercel env settings) without code changes.
 *
 * To swap: in Vercel → Settings → Environment Variables, add e.g.
 *   APIFY_ACTOR_LINKEDIN = some-other/linkedin-actor
 * then redeploy.
 */
const ACTORS = {
  tiktok:    process.env.APIFY_ACTOR_TIKTOK    || "clockworks/free-tiktok-scraper",
  instagram: process.env.APIFY_ACTOR_INSTAGRAM || "apify/instagram-scraper",
  // Default LinkedIn actor (verified working by Rohan on Apify console) —
  // single-post detail extractor at console.apify.com/actors/HFElvVpoWmD1bD9A7
  linkedin:  process.env.APIFY_ACTOR_LINKEDIN  || "HFElvVpoWmD1bD9A7",
  twitter:   process.env.APIFY_ACTOR_TWITTER   || "apidojo/tweet-scraper",
  youtube:   process.env.APIFY_ACTOR_YOUTUBE   || "streamers/youtube-scraper",
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

type LinkedInRow = Record<string, unknown> & {
  // -- harvestapi/linkedin-post-analytics-scraper (HFElvVpoWmD1bD9A7) --
  post_text?: string;
  post_link?: string;
  image_component?: string[];
  posted_at?: string;
  social_count?: {
    num_likes?: number;
    num_comments?: number;
    num_shares?: number;
    reaction_type_counts?: Array<{ count: number; reaction_type: string }>;
  };
  // The `actor` key inside the row refers to the LinkedIn AUTHOR
  // (not the Apify actor), per this scraper's schema.
  actor?:
    | string
    | {
        actor_name?: string;
        actor_sub_description?: string;
        actor_description?: string;
        actor_image?: string;
        actor_link?: string;
        name?: string;
        fullName?: string;
      };

  // -- Other actor variants (fallback field names) --
  text?: string;
  postText?: string;
  content?: string;
  description?: string;
  body?: string;
  commentary?: string;
  message?: string;
  summary?: string;
  postContent?: string;
  articleText?: string;
  postUrl?: string;
  url?: string;
  authorName?: string;
  imageUrl?: string;
  image?: string;
  thumbnailUrl?: string;
  media?: Array<{ url?: string; thumbnail?: string }>;
  likes?: number;
  numLikes?: number;
  comments?: number;
  numComments?: number;
  shares?: number;
  numShares?: number;
  views?: number;
  post?: Record<string, unknown>;
  data?: Record<string, unknown>;
};

/**
 * Last-resort caption finder — walks the object and returns the longest
 * string property at any depth. Used when no known field name matches.
 */
function findLongestText(obj: unknown, minLen = 40): string | undefined {
  let best: string | undefined;
  const visit = (v: unknown) => {
    if (typeof v === "string") {
      if (v.length >= minLen && (!best || v.length > best.length)) best = v;
    } else if (Array.isArray(v)) {
      v.forEach(visit);
    } else if (v && typeof v === "object") {
      Object.values(v as Record<string, unknown>).forEach(visit);
    }
  };
  visit(obj);
  return best;
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
    // Different LinkedIn actors expect different input shapes. We send a
    // superset so most actors find the keys they need:
    //   - harvestapi/linkedin-post-detail expects `postUrls`
    //   - apimaestro/linkedin-profile-posts expects `urls`
    //   - some actors expect `startUrls`
    const rows = (await runActor(
      ACTORS.linkedin,
      {
        postUrls: [url],
        urls: [url],
        startUrls: [{ url }],
        maxPosts: 1,
        maxItems: 1,
      },
      120
    )) as LinkedInRow[];

    const r = rows[0];
    if (!r) throw new Error("No data returned from LinkedIn actor");

    // Look in r AND any nested .post / .data envelopes
    const nested =
      (r.post && typeof r.post === "object" ? (r.post as LinkedInRow) : undefined) ??
      (r.data && typeof r.data === "object" ? (r.data as LinkedInRow) : undefined);
    const src: LinkedInRow = { ...(nested ?? {}), ...r };

    // Try every known field name + last-resort longest-text scan
    let caption: string | undefined =
      src.post_text ??
      src.text ??
      src.postText ??
      src.content ??
      src.description ??
      src.body ??
      src.commentary ??
      src.message ??
      src.summary ??
      src.postContent ??
      src.articleText ??
      undefined;

    if (!caption) caption = findLongestText(src);

    // Reject "caption" that's actually just a URL — happens when the actor
    // returns minimal data and our longest-text fallback grabs the post link.
    if (caption && /^https?:\/\//i.test(caption.trim()) && !/\s/.test(caption.trim())) {
      caption = undefined;
    }

    // Author display name — `actor` here means the LinkedIn AUTHOR, not the
    // Apify actor (this scraper's schema names it that way).
    const author =
      typeof src.actor === "string"
        ? src.actor
        : src.actor?.actor_name ??
          src.actor?.fullName ??
          src.actor?.name ??
          src.authorName;

    const thumb =
      src.image_component?.[0] ??
      src.imageUrl ??
      src.image ??
      src.thumbnailUrl ??
      src.media?.[0]?.url ??
      src.media?.[0]?.thumbnail ??
      (typeof src.actor === "object" ? src.actor?.actor_image : undefined);

    // Metrics — auto-populate the analyze form
    const metrics: ScrapedMetrics = {
      likes: src.social_count?.num_likes ?? src.numLikes ?? src.likes,
      comments:
        src.social_count?.num_comments ?? src.numComments ?? src.comments,
      shares: src.social_count?.num_shares ?? src.numShares ?? src.shares,
      views: src.views,
    };

    // If the actor returned a post URL that doesn't match what we asked for,
    // surface this as a soft warning — common with profile-feed actors.
    const returnedUrl = src.post_link ?? src.postUrl ?? src.url;
    const mismatched =
      returnedUrl && url && stripQuery(returnedUrl) !== stripQuery(url);

    if (!caption) {
      const keys = Object.keys(src).slice(0, 12).join(", ");
      const sample = JSON.stringify(src).slice(0, 400);
      throw new Error(
        `Actor returned no readable caption for this URL. Likely the post is private, deleted, or restricted. Top-level fields returned: [${keys}]. Sample: ${sample}. Paste caption manually below.`
      );
    }

    return {
      ok: !mismatched,
      source: "apify",
      actor: ACTORS.linkedin,
      platform: "linkedin",
      title: author,
      caption,
      thumbnail_url: thumb,
      metrics: hasAnyMetric(metrics) ? metrics : undefined,
      source_url: url,
      raw: r,
      message: mismatched
        ? `Apify returned a different post than the URL you provided. Set APIFY_ACTOR_LINKEDIN in Vercel env to a post-detail actor from apify.com/store.`
        : "LinkedIn post + analytics extracted via Apify.",
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

function stripQuery(u: string) {
  return u.split(/[?#]/)[0].replace(/\/$/, "").toLowerCase();
}

function hasAnyMetric(m: ScrapedMetrics): boolean {
  return Object.values(m).some(
    (v) => typeof v === "number" && !Number.isNaN(v)
  );
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
