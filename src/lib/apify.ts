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

/**
 * Profile-level actors — different from the single-post ones because
 * the input shape and reliability differ. For bulk pulls of a creator's
 * recent posts, these are the right actors.
 */
const PROFILE_ACTORS = {
  tiktok:    process.env.APIFY_ACTOR_TIKTOK_PROFILE    || "clockworks/free-tiktok-scraper",
  instagram: process.env.APIFY_ACTOR_INSTAGRAM_PROFILE || "apify/instagram-scraper",
  // apimaestro/linkedin-profile-posts has 98% success / 1M+ runs in last 30d
  linkedin:  process.env.APIFY_ACTOR_LINKEDIN_PROFILE  || "apimaestro/linkedin-profile-posts",
  twitter:   process.env.APIFY_ACTOR_TWITTER_PROFILE   || "apidojo/tweet-scraper",
  youtube:   process.env.APIFY_ACTOR_YOUTUBE_PROFILE   || "streamers/youtube-scraper",
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
  // When LinkedIn refuses a post (private / restricted), the actor returns
  // this envelope instead of normal content.
  entity_component?: { title?: string };
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
  viewCount?: number;
  likes?: number;
  numberOfLikes?: number;
  commentsCount?: number;
  numberOfComments?: number;
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

    const metrics: ScrapedMetrics = {
      views: r.playCount,
      likes: r.diggCount,
      comments: r.commentCount,
      shares: r.shareCount,
      saves: r.collectCount,
    };

    return {
      ok: true,
      source: "apify",
      actor: ACTORS.tiktok,
      platform: "tiktok",
      title: r.authorMeta?.name ? `@${r.authorMeta.name}` : undefined,
      caption: r.text,
      thumbnail_url: r.videoMeta?.coverUrl,
      metrics: hasAnyMetric(metrics) ? metrics : undefined,
      source_url: url,
      raw: r,
      message: "TikTok content + analytics extracted via Apify.",
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

    const metrics: ScrapedMetrics = {
      views: r.videoViewCount,
      likes: r.likesCount,
      comments: r.commentsCount,
    };

    return {
      ok: true,
      source: "apify",
      actor: ACTORS.instagram,
      platform: "instagram",
      title: r.ownerUsername ? `@${r.ownerUsername}` : undefined,
      caption: r.caption,
      thumbnail_url: r.displayUrl,
      metrics: hasAnyMetric(metrics) ? metrics : undefined,
      source_url: url,
      raw: r,
      message: "Instagram content + analytics extracted via Apify.",
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
    //   - data-slayer/linkedin-post-analytics-scraper expects `linkedin_url` (singular string)
    //   - harvestapi/linkedin-post-detail expects `postUrls`
    //   - apimaestro/linkedin-profile-posts expects `urls`
    //   - some actors expect `startUrls`
    const rows = (await runActor(
      ACTORS.linkedin,
      {
        linkedin_url: url,
        linkedinUrl: url,
        url: url,
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

    // LinkedIn-side refusal: the actor returns an "entity_component" envelope
    // with a "post cannot be displayed" title when the post is private,
    // deleted, restricted, or otherwise blocked by LinkedIn.
    const blockedTitle =
      r.entity_component?.title ??
      (r.entity_component &&
      typeof r.entity_component === "object" &&
      "title" in r.entity_component
        ? (r.entity_component as { title?: string }).title
        : undefined);

    if (blockedTitle && /cannot be displayed|not.?available|restricted|private/i.test(blockedTitle)) {
      throw new Error(
        `LinkedIn refused to show this post to the scraper ("${blockedTitle}"). This is a LinkedIn visibility restriction, not a code issue. Likely the post is private, deleted, or restricted to specific connections. Paste the caption manually below, or try a different LinkedIn post.`
      );
    }

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

    const metrics: ScrapedMetrics = {
      views: r.viewCount,
      likes: r.likes ?? r.numberOfLikes,
      comments: r.commentsCount ?? r.numberOfComments,
    };

    return {
      ok: true,
      source: "apify",
      actor: ACTORS.youtube,
      platform: "youtube",
      title: r.title ?? (r.channelName ? `${r.channelName}` : undefined),
      caption: r.description,
      transcript,
      thumbnail_url: r.thumbnailUrl ?? r.thumbnail,
      metrics: hasAnyMetric(metrics) ? metrics : undefined,
      source_url: url,
      raw: r,
      message: transcript
        ? "YouTube content + transcript + analytics extracted via Apify."
        : "YouTube metadata + analytics extracted via Apify (no captions found).",
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
    // apidojo/tweet-scraper expects `startUrls` (array of URL strings or objects)
    const rows = (await runActor(ACTORS.twitter, {
      startUrls: [url],
      tweetUrls: [url],
      maxItems: 1,
    })) as TwitterRow[];
    const r = rows[0];
    if (!r) throw new Error("No data returned from Twitter actor");

    const metrics: ScrapedMetrics = {
      views: r.viewCount,
      likes: r.likeCount,
      comments: r.replyCount,
      shares: r.retweetCount,
    };

    return {
      ok: true,
      source: "apify",
      actor: ACTORS.twitter,
      platform: "other",
      title: r.author?.userName ? `@${r.author.userName}` : undefined,
      caption: r.fullText ?? r.text,
      thumbnail_url: r.mediaUrl,
      metrics: hasAnyMetric(metrics) ? metrics : undefined,
      source_url: url,
      raw: r,
      message: "Tweet + analytics extracted via Apify.",
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

// ════════════════════════════════════════════════════════════════════════════
//   BULK PROFILE SCRAPE  (V1.2)
//
// Given a handle + platform + count, pull that creator's N most recent posts.
// Used by competitor / creator / brand pages so the user can bulk-import
// content for analysis without pasting URLs one by one.
// ════════════════════════════════════════════════════════════════════════════

export interface ScrapedPost {
  platform: Platform;
  source_url: string;
  title?: string;        // e.g. "@username" or post title
  caption?: string;
  transcript?: string;
  thumbnail_url?: string;
  metrics?: ScrapedMetrics;
  posted_at?: string;    // ISO timestamp if available
}

export interface ScrapeProfileResult {
  ok: boolean;
  platform: Platform;
  handle: string;
  posts: ScrapedPost[];
  message: string;
  actor: string;
}

/**
 * Normalize a handle/URL/at-handle into a bare username for actors that need it.
 */
function bareHandle(input: string): string {
  let s = input.trim();
  if (s.startsWith("@")) s = s.slice(1);
  // Pull username from a URL
  const m = s.match(/^https?:\/\/(?:www\.)?(?:tiktok\.com|instagram\.com|linkedin\.com\/in|linkedin\.com\/company|twitter\.com|x\.com|youtube\.com)\/@?([^/?#]+)/i);
  if (m) return m[1];
  return s;
}

function asUrl(input: string, platform: Platform): string {
  if (/^https?:\/\//i.test(input)) return input.replace(/\/+$/, "");
  const h = bareHandle(input);
  switch (platform) {
    case "tiktok":    return `https://www.tiktok.com/@${h}`;
    case "instagram": return `https://www.instagram.com/${h}/`;
    case "linkedin":  return `https://www.linkedin.com/in/${h}`;
    case "youtube":   return `https://www.youtube.com/@${h}`;
    default:          return `https://x.com/${h}`;
  }
}

// ─────────────────────────  TikTok bulk  ─────────────────────────
async function scrapeTikTokProfile(handle: string, count: number): Promise<ScrapeProfileResult> {
  const username = bareHandle(handle);
  try {
    const rows = (await runActor(
      PROFILE_ACTORS.tiktok,
      {
        profiles: [username],
        resultsPerPage: count,
        profileScrapeSections: ["videos"],
        profileSorting: "latest",
        shouldDownloadVideos: false,
        shouldDownloadCovers: false,
        excludePinnedPosts: false,
      },
      180
    )) as TikTokRow[];

    const posts: ScrapedPost[] = rows.slice(0, count).map((r) => ({
      platform: "tiktok",
      source_url: r.webVideoUrl ?? r.videoUrl ?? `https://www.tiktok.com/@${username}`,
      title: r.authorMeta?.name ? `@${r.authorMeta.name}` : undefined,
      caption: r.text,
      thumbnail_url: r.videoMeta?.coverUrl,
      metrics: hasAnyMetric({
        views: r.playCount,
        likes: r.diggCount,
        comments: r.commentCount,
        shares: r.shareCount,
        saves: r.collectCount,
      })
        ? {
            views: r.playCount,
            likes: r.diggCount,
            comments: r.commentCount,
            shares: r.shareCount,
            saves: r.collectCount,
          }
        : undefined,
    }));

    return {
      ok: true,
      platform: "tiktok",
      handle: username,
      posts,
      actor: PROFILE_ACTORS.tiktok,
      message: `Pulled ${posts.length} TikTok posts from @${username}.`,
    };
  } catch (err) {
    return {
      ok: false,
      platform: "tiktok",
      handle: username,
      posts: [],
      actor: PROFILE_ACTORS.tiktok,
      message: err instanceof Error ? err.message : "TikTok profile scrape failed",
    };
  }
}

// ─────────────────────────  Instagram bulk  ─────────────────────────
async function scrapeInstagramProfile(handle: string, count: number): Promise<ScrapeProfileResult> {
  const username = bareHandle(handle);
  const profileUrl = `https://www.instagram.com/${username}/`;
  try {
    const rows = (await runActor(
      PROFILE_ACTORS.instagram,
      {
        directUrls: [profileUrl],
        resultsType: "posts",
        resultsLimit: count,
        addParentData: false,
      },
      180
    )) as IgRow[];

    const posts: ScrapedPost[] = rows.slice(0, count).map((r) => ({
      platform: "instagram",
      source_url: r.shortCode
        ? `https://www.instagram.com/p/${r.shortCode}/`
        : profileUrl,
      title: r.ownerUsername ? `@${r.ownerUsername}` : `@${username}`,
      caption: r.caption,
      thumbnail_url: r.displayUrl,
      metrics: hasAnyMetric({
        views: r.videoViewCount,
        likes: r.likesCount,
        comments: r.commentsCount,
      })
        ? {
            views: r.videoViewCount,
            likes: r.likesCount,
            comments: r.commentsCount,
          }
        : undefined,
    }));

    return {
      ok: true,
      platform: "instagram",
      handle: username,
      posts,
      actor: PROFILE_ACTORS.instagram,
      message: `Pulled ${posts.length} Instagram posts from @${username}.`,
    };
  } catch (err) {
    return {
      ok: false,
      platform: "instagram",
      handle: username,
      posts: [],
      actor: PROFILE_ACTORS.instagram,
      message: err instanceof Error ? err.message : "Instagram profile scrape failed",
    };
  }
}

// ─────────────────────────  LinkedIn bulk  ─────────────────────────
async function scrapeLinkedInProfile(handle: string, count: number): Promise<ScrapeProfileResult> {
  const username = bareHandle(handle);
  try {
    const rows = (await runActor(
      PROFILE_ACTORS.linkedin,
      {
        username,
        total_posts: count,
        limit: count,
        page_number: 1,
      },
      180
    )) as LinkedInRow[];

    const posts: ScrapedPost[] = rows.slice(0, count).map((r) => {
      const caption =
        r.post_text ??
        r.text ??
        r.postText ??
        r.content ??
        r.description ??
        undefined;
      const author =
        typeof r.actor === "string"
          ? r.actor
          : r.actor?.actor_name ??
            r.actor?.fullName ??
            r.actor?.name ??
            r.authorName;
      const thumb =
        r.image_component?.[0] ??
        r.imageUrl ??
        r.image ??
        r.thumbnailUrl ??
        (typeof r.actor === "object" ? r.actor?.actor_image : undefined);
      const source =
        r.post_link ??
        r.postUrl ??
        r.url ??
        `https://www.linkedin.com/in/${username}`;
      const metrics: ScrapedMetrics = {
        likes: r.social_count?.num_likes ?? r.numLikes ?? r.likes,
        comments:
          r.social_count?.num_comments ?? r.numComments ?? r.comments,
        shares: r.social_count?.num_shares ?? r.numShares ?? r.shares,
      };
      return {
        platform: "linkedin",
        source_url: source,
        title: author ?? `@${username}`,
        caption,
        thumbnail_url: thumb,
        metrics: hasAnyMetric(metrics) ? metrics : undefined,
        posted_at: r.posted_at,
      };
    });

    return {
      ok: posts.length > 0,
      platform: "linkedin",
      handle: username,
      posts,
      actor: PROFILE_ACTORS.linkedin,
      message: `Pulled ${posts.length} LinkedIn posts from ${username}.`,
    };
  } catch (err) {
    return {
      ok: false,
      platform: "linkedin",
      handle: username,
      posts: [],
      actor: PROFILE_ACTORS.linkedin,
      message: err instanceof Error ? err.message : "LinkedIn profile scrape failed",
    };
  }
}

// ─────────────────────────  Twitter bulk  ─────────────────────────
async function scrapeTwitterProfile(handle: string, count: number): Promise<ScrapeProfileResult> {
  const username = bareHandle(handle);
  try {
    const rows = (await runActor(
      PROFILE_ACTORS.twitter,
      {
        twitterHandles: [username],
        maxItems: count,
        sort: "Latest",
      },
      180
    )) as TwitterRow[];

    const posts: ScrapedPost[] = rows.slice(0, count).map((r) => ({
      platform: "other",
      source_url: r.url ?? `https://x.com/${username}`,
      title: r.author?.userName ? `@${r.author.userName}` : `@${username}`,
      caption: r.fullText ?? r.text,
      thumbnail_url: r.mediaUrl,
      metrics: hasAnyMetric({
        views: r.viewCount,
        likes: r.likeCount,
        comments: r.replyCount,
        shares: r.retweetCount,
      })
        ? {
            views: r.viewCount,
            likes: r.likeCount,
            comments: r.replyCount,
            shares: r.retweetCount,
          }
        : undefined,
    }));

    return {
      ok: true,
      platform: "other",
      handle: username,
      posts,
      actor: PROFILE_ACTORS.twitter,
      message: `Pulled ${posts.length} tweets from @${username}.`,
    };
  } catch (err) {
    return {
      ok: false,
      platform: "other",
      handle: username,
      posts: [],
      actor: PROFILE_ACTORS.twitter,
      message: err instanceof Error ? err.message : "Twitter profile scrape failed",
    };
  }
}

// ─────────────────────────  YouTube bulk  ─────────────────────────
async function scrapeYouTubeProfile(handle: string, count: number): Promise<ScrapeProfileResult> {
  const username = bareHandle(handle);
  const channelUrl = asUrl(username, "youtube");
  try {
    const rows = (await runActor(
      PROFILE_ACTORS.youtube,
      {
        startUrls: [{ url: channelUrl }],
        maxResults: count,
        maxResultsShorts: 0,
        downloadSubtitles: false,
      },
      180
    )) as YouTubeRow[];

    const posts: ScrapedPost[] = rows.slice(0, count).map((r) => ({
      platform: "youtube",
      source_url: r.url ?? channelUrl,
      title: r.title ?? r.channelName ?? `@${username}`,
      caption: r.description,
      thumbnail_url: r.thumbnailUrl ?? r.thumbnail,
      metrics: hasAnyMetric({
        views: r.viewCount,
        likes: r.likes ?? r.numberOfLikes,
        comments: r.commentsCount ?? r.numberOfComments,
      })
        ? {
            views: r.viewCount,
            likes: r.likes ?? r.numberOfLikes,
            comments: r.commentsCount ?? r.numberOfComments,
          }
        : undefined,
    }));

    return {
      ok: true,
      platform: "youtube",
      handle: username,
      posts,
      actor: PROFILE_ACTORS.youtube,
      message: `Pulled ${posts.length} YouTube videos from @${username}.`,
    };
  } catch (err) {
    return {
      ok: false,
      platform: "youtube",
      handle: username,
      posts: [],
      actor: PROFILE_ACTORS.youtube,
      message: err instanceof Error ? err.message : "YouTube profile scrape failed",
    };
  }
}

/**
 * Public dispatcher — scrape a profile's recent posts by platform.
 * Caps `count` at 100 to keep cost predictable.
 */
export async function scrapeProfile(
  handle: string,
  platform: Platform,
  count = 20
): Promise<ScrapeProfileResult> {
  if (!process.env.APIFY_TOKEN) {
    return {
      ok: false,
      platform,
      handle,
      posts: [],
      actor: "<none>",
      message:
        "APIFY_TOKEN not set in env vars. Add it in Vercel → Settings → Environment Variables.",
    };
  }
  const n = Math.max(1, Math.min(100, Math.floor(count)));
  switch (platform) {
    case "tiktok":    return scrapeTikTokProfile(handle, n);
    case "instagram": return scrapeInstagramProfile(handle, n);
    case "linkedin":  return scrapeLinkedInProfile(handle, n);
    case "youtube":   return scrapeYouTubeProfile(handle, n);
    default:          return scrapeTwitterProfile(handle, n);
  }
}
