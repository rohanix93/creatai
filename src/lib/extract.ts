/**
 * CREATAI :: extraction pipeline
 *
 * Given a URL or file, attempt to extract:
 *  - caption / transcript text
 *  - title
 *  - thumbnail URL
 *  - inferred platform + content type
 *
 * V1 supports:
 *   - YouTube (transcript via youtube-transcript npm)
 *   - Image URLs (GPT-4o vision describes the image, stored as transcript proxy)
 *   - Manual entry (no extraction, user pasted everything)
 *
 * V1.1 will add:
 *   - TikTok / Instagram / LinkedIn via paid scraper (Apify)
 *   - Audio file → Whisper transcription
 */

import { YoutubeTranscript } from "youtube-transcript";
import { openai, MODELS } from "./openai";
import { scrapeViaApify } from "./apify";
import type { Platform } from "./types";

export interface ExtractionResult {
  platform: Platform;
  source: "youtube" | "vision" | "whisper" | "manual" | "unsupported";
  title?: string;
  transcript?: string;
  caption?: string;
  thumbnail_url?: string;
  // user-facing
  ok: boolean;
  message: string;
}

export function detectPlatform(url: string): Platform {
  const u = url.toLowerCase();
  if (u.includes("youtube.com") || u.includes("youtu.be")) return "youtube";
  if (u.includes("tiktok.com")) return "tiktok";
  if (u.includes("instagram.com")) return "instagram";
  if (u.includes("linkedin.com")) return "linkedin";
  if (u.includes("facebook.com/ads") || u.includes("ads.facebook")) return "meta_ad";
  if (/\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(u)) return "other"; // image -> "other" but we vision-handle it
  return "other";
}

function isImageUrl(url: string) {
  return /\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(url);
}

function extractYoutubeId(url: string): string | null {
  const m =
    url.match(/[?&]v=([A-Za-z0-9_-]{11})/) ||
    url.match(/youtu\.be\/([A-Za-z0-9_-]{11})/) ||
    url.match(/youtube\.com\/shorts\/([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

async function extractYouTube(url: string): Promise<ExtractionResult> {
  const id = extractYoutubeId(url);
  if (!id) {
    return {
      platform: "youtube",
      source: "unsupported",
      ok: false,
      message: "Could not parse YouTube video ID from that URL.",
    };
  }

  // Try Apify FIRST because youtube-transcript npm package gets blocked
  // by YouTube's anti-bot rules from cloud-provider IPs (Vercel, AWS, GCP).
  // Apify uses residential proxies and is reliable.
  if (process.env.APIFY_TOKEN) {
    const apify = await scrapeViaApify(url, "youtube");
    if (apify && apify.ok) {
      return {
        platform: "youtube",
        source: "youtube",
        title: apify.title,
        transcript: apify.transcript,
        caption: apify.caption,
        thumbnail_url: apify.thumbnail_url ?? `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
        ok: true,
        message: apify.message,
      };
    }
  }

  // Fallback: try the npm library (works locally; usually fails on Vercel)
  try {
    const transcriptParts = await YoutubeTranscript.fetchTranscript(id);
    const transcript = transcriptParts
      .map((p) => p.text)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    // Try to also fetch oEmbed for title + thumbnail (no API key needed)
    let title: string | undefined;
    let thumbnail_url: string | undefined;
    try {
      const r = await fetch(
        `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`
      );
      if (r.ok) {
        const data = await r.json();
        title = data.title;
        thumbnail_url = data.thumbnail_url;
      }
    } catch {
      /* oembed failed — ignore, not critical */
    }
    if (!thumbnail_url) {
      thumbnail_url = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
    }

    return {
      platform: "youtube",
      source: "youtube",
      title,
      transcript,
      thumbnail_url,
      ok: true,
      message: transcript
        ? "YouTube transcript extracted."
        : "YouTube video found but no transcript available — paste manually below if needed.",
    };
  } catch {
    // Both paths failed — gracefully ask user to paste
    return {
      platform: "youtube",
      source: "unsupported",
      thumbnail_url: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      ok: false,
      message: process.env.APIFY_TOKEN
        ? "Both Apify and direct extraction failed for this YouTube video. It may be private, age-restricted, or have transcripts disabled. Paste transcript manually."
        : "YouTube transcript extraction is blocked on Vercel by YouTube. Add APIFY_TOKEN to env vars (apify.com) for reliable extraction, or paste the transcript manually.",
    };
  }
}

async function extractImage(url: string): Promise<ExtractionResult> {
  try {
    const completion = await openai().chat.completions.create({
      model: MODELS.vision,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text:
                "You are a content analyst. Describe what's in this image as if you were preparing it for creative analysis. Cover: visible text/copy, headline if any, subject, setting, mood, colors, composition, format cues (story/post/ad). Be specific. No preamble.",
            },
            { type: "image_url", image_url: { url } },
          ],
        },
      ],
      max_tokens: 600,
    });
    const description = completion.choices[0]?.message?.content ?? "";
    return {
      platform: "other",
      source: "vision",
      title: "Image asset",
      transcript: description,
      thumbnail_url: url,
      ok: true,
      message: "Image analyzed via vision.",
    };
  } catch (err) {
    return {
      platform: "other",
      source: "unsupported",
      thumbnail_url: url,
      ok: false,
      message: "Could not analyze image. Make sure the URL is publicly accessible and try again.",
    };
  }
}

export async function extractFromUrl(url: string): Promise<ExtractionResult> {
  const platform = detectPlatform(url);
  if (platform === "youtube") return extractYouTube(url);
  if (isImageUrl(url)) return extractImage(url);

  // Try Apify for TikTok, Instagram, LinkedIn, Twitter/X.
  const apify = await scrapeViaApify(url, platform);
  if (apify && apify.ok) {
    return {
      platform: apify.platform,
      source: "vision", // closest existing enum; we treat scraped data as extracted content
      title: apify.title,
      caption: apify.caption,
      transcript: undefined,
      thumbnail_url: apify.thumbnail_url,
      ok: true,
      message: apify.message,
    };
  }

  // Apify either disabled (no token) or failed — fall back to manual
  return {
    platform,
    source: "unsupported",
    ok: false,
    message: apify
      ? `Apify could not extract this URL (${apify.message}). Paste caption/transcript manually.`
      : platform === "tiktok" || platform === "instagram" || platform === "linkedin"
        ? `Auto-extraction for ${platform} requires APIFY_TOKEN. Add it to env vars to enable. For now, paste manually.`
        : "Auto-extraction isn't available for this URL yet. Paste manually.",
  };
}

/**
 * Whisper transcription for an uploaded audio/video file.
 * Caller streams the file to OpenAI's transcription API.
 */
export async function transcribeAudio(file: File): Promise<{ text: string; ok: boolean; message: string }> {
  try {
    const result = await openai().audio.transcriptions.create({
      file,
      model: MODELS.transcription,
    });
    return { text: result.text, ok: true, message: "Audio transcribed." };
  } catch (err) {
    return { text: "", ok: false, message: "Could not transcribe audio." };
  }
}
