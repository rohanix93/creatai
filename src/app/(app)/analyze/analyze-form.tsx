"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Select } from "@/components/ui/input";
import { Label, FieldError, FieldHint } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import type { Brand, Competitor, Creator } from "@/lib/types";

interface AnalyzeFormProps {
  brands: Brand[];
  activeBrandId: string | null;
  competitors: Competitor[];
  creators: Creator[];
}

type ExtractResp = {
  platform?: string;
  source?: string;
  title?: string;
  transcript?: string;
  caption?: string;
  thumbnail_url?: string;
  ok?: boolean;
  message?: string;
  error?: string;
};

export function AnalyzeForm({
  brands,
  activeBrandId,
  competitors,
  creators,
}: AnalyzeFormProps) {
  const router = useRouter();
  const [isExtracting, setIsExtracting] = useState(false);
  const [isAnalyzing, startAnalyze] = useTransition();
  const [extractMsg, setExtractMsg] = useState<{
    type: "info" | "ok" | "warn" | "error";
    text: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [brandId, setBrandId] = useState(activeBrandId ?? "");
  const [sourceUrl, setSourceUrl] = useState("");
  const [platform, setPlatform] = useState("");
  const [contentType, setContentType] = useState("");
  const [title, setTitle] = useState("");
  const [campaign, setCampaign] = useState("");
  const [creatorName, setCreatorName] = useState("");
  const [competitorName, setCompetitorName] = useState("");
  const [caption, setCaption] = useState("");
  const [transcript, setTranscript] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [metrics, setMetrics] = useState({
    views: "",
    likes: "",
    comments: "",
    shares: "",
    saves: "",
    spend: "",
    conversions: "",
  });
  const [notes, setNotes] = useState("");
  const [extractionSource, setExtractionSource] = useState<string>("manual");

  async function handleExtract() {
    if (!sourceUrl) {
      setExtractMsg({ type: "warn", text: "Paste a URL first." });
      return;
    }
    setIsExtracting(true);
    setExtractMsg({ type: "info", text: "Pulling content…" });
    try {
      const r = await fetch("/api/extract", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: sourceUrl }),
      });
      const data: ExtractResp = await r.json();

      if (data.platform) setPlatform(data.platform);
      if (data.title && !title) setTitle(data.title);
      if (data.transcript) setTranscript(data.transcript);
      if (data.caption) setCaption(data.caption);
      if (data.thumbnail_url) setThumbnailUrl(data.thumbnail_url);
      if (data.source) setExtractionSource(data.source);

      if (data.ok) {
        setExtractMsg({ type: "ok", text: data.message ?? "Content extracted." });
      } else {
        setExtractMsg({
          type: "warn",
          text:
            data.message ??
            data.error ??
            "Could not auto-extract. Paste caption/transcript manually below.",
        });
      }
    } catch {
      setExtractMsg({
        type: "error",
        text: "Extract request failed. Check your connection or try manual entry.",
      });
    } finally {
      setIsExtracting(false);
    }
  }

  function handleAnalyze() {
    setError(null);

    if (!sourceUrl && !caption && !transcript && !thumbnailUrl) {
      setError("Provide at least a URL, a caption, a transcript, or a thumbnail URL.");
      return;
    }

    const toNum = (s: string) => {
      const n = Number(s.replace(/[^0-9.-]/g, ""));
      return Number.isFinite(n) && s.trim() !== "" ? n : null;
    };

    const body = {
      brand_id: brandId || null,
      platform: platform || null,
      content_type: contentType || null,
      source_url: sourceUrl || null,
      title: title || null,
      campaign_name: campaign || null,
      creator_name: creatorName || null,
      competitor_name: competitorName || null,
      caption: caption || null,
      transcript: transcript || null,
      thumbnail_url: thumbnailUrl || null,
      views: toNum(metrics.views),
      likes: toNum(metrics.likes),
      comments: toNum(metrics.comments),
      shares: toNum(metrics.shares),
      saves: toNum(metrics.saves),
      spend: toNum(metrics.spend),
      conversions: toNum(metrics.conversions),
      notes: notes || null,
      extraction_status: extractionSource === "manual" ? "manual" : "extracted",
      extraction_source: extractionSource,
    };

    startAnalyze(async () => {
      try {
        const r = await fetch("/api/analyze", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await r.json();
        if (!r.ok || !data.ok) {
          setError(data.error ?? "Analysis failed");
          return;
        }
        router.push(`/library/${data.asset_id}`);
      } catch {
        setError("Network error during analysis");
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Brand selector */}
      <div>
        <Label htmlFor="brand_id">Brand context</Label>
        <Select
          id="brand_id"
          value={brandId}
          onChange={(e) => setBrandId(e.target.value)}
        >
          <option value="">— None (analyze generically) —</option>
          {brands.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
              {b.is_active ? "  ●" : ""}
            </option>
          ))}
        </Select>
        <FieldHint>
          The brand profile shapes the analysis: audience, tone, USPs all feed in.
        </FieldHint>
      </div>

      {/* URL + extract */}
      <div className="border border-line-100 bg-bg-1/40 p-4 space-y-3">
        <div className="cret-mono text-[10px] uppercase tracking-[0.2em] text-scan-red flex items-center gap-2">
          <span className="w-2 h-2 bg-scan-red cret-pulse" />
          AUTO-EXTRACTION
        </div>
        <div>
          <Label htmlFor="source_url">Content URL</Label>
          <div className="flex gap-2">
            <Input
              id="source_url"
              type="url"
              placeholder="https://youtube.com/watch?v=... or any URL"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
            />
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={handleExtract}
              disabled={isExtracting}
            >
              {isExtracting ? "PULLING…" : "▶ EXTRACT"}
            </Button>
          </div>
          <FieldHint>
            YouTube transcripts pull automatically. Image URLs analyzed by vision. Other
            platforms — paste content manually below.
          </FieldHint>
        </div>
        {extractMsg && (
          <div
            className={
              "border px-3 py-2 cret-mono text-[10px] uppercase tracking-[0.15em] " +
              (extractMsg.type === "ok"
                ? "border-neon-green bg-[rgba(0,255,157,0.06)] text-neon-green"
                : extractMsg.type === "warn"
                  ? "border-neon-amber bg-[rgba(255,176,32,0.06)] text-neon-amber"
                  : extractMsg.type === "error"
                    ? "border-scan-red bg-[rgba(255,77,77,0.06)] text-scan-red"
                    : "border-neon-blue bg-[rgba(0,212,255,0.06)] text-neon-blue")
            }
          >
            {extractMsg.type === "ok" ? "● " : extractMsg.type === "info" ? "↻ " : "! "}{" "}
            {extractMsg.text}
          </div>
        )}
      </div>

      {/* Platform + content type */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="platform">Platform</Label>
          <Select
            id="platform"
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
          >
            <option value="">—</option>
            <option value="instagram">Instagram</option>
            <option value="tiktok">TikTok</option>
            <option value="youtube">YouTube</option>
            <option value="linkedin">LinkedIn</option>
            <option value="meta_ad">Meta Ad</option>
            <option value="other">Other</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="content_type">Content type</Label>
          <Select
            id="content_type"
            value={contentType}
            onChange={(e) => setContentType(e.target.value)}
          >
            <option value="">—</option>
            <option value="video">Video</option>
            <option value="image">Image</option>
            <option value="carousel">Carousel</option>
            <option value="story">Story</option>
            <option value="ad">Ad</option>
            <option value="post">Post</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            placeholder="Display label"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
      </div>

      {/* Creator + competitor + campaign */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="creator_name">Creator</Label>
          <Input
            id="creator_name"
            list="creators-list"
            placeholder="Type or pick"
            value={creatorName}
            onChange={(e) => setCreatorName(e.target.value)}
          />
          <datalist id="creators-list">
            {creators.map((c) => (
              <option key={c.id} value={c.name} />
            ))}
          </datalist>
        </div>
        <div>
          <Label htmlFor="competitor_name">Competitor</Label>
          <Input
            id="competitor_name"
            list="competitors-list"
            placeholder="Type or pick"
            value={competitorName}
            onChange={(e) => setCompetitorName(e.target.value)}
          />
          <datalist id="competitors-list">
            {competitors.map((c) => (
              <option key={c.id} value={c.name} />
            ))}
          </datalist>
        </div>
        <div>
          <Label htmlFor="campaign">Campaign</Label>
          <Input
            id="campaign"
            placeholder="Optional campaign label"
            value={campaign}
            onChange={(e) => setCampaign(e.target.value)}
          />
        </div>
      </div>

      {/* Caption + transcript */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="caption">Caption</Label>
          <Textarea
            id="caption"
            rows={5}
            placeholder="Paste the post caption or copy"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="transcript">Transcript / on-screen text</Label>
          <Textarea
            id="transcript"
            rows={5}
            placeholder="Auto-fills from extraction. Otherwise paste here."
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
          />
        </div>
      </div>

      {/* Thumbnail */}
      <div>
        <Label htmlFor="thumbnail_url">Thumbnail / screenshot URL</Label>
        <Input
          id="thumbnail_url"
          type="url"
          placeholder="https://...jpg or auto-filled from extraction"
          value={thumbnailUrl}
          onChange={(e) => setThumbnailUrl(e.target.value)}
        />
        {thumbnailUrl && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={thumbnailUrl}
            alt="thumbnail"
            className="mt-2 border border-line-100 max-h-40"
          />
        )}
      </div>

      {/* Metrics */}
      <div>
        <div className="cret-mono text-[10px] uppercase tracking-[0.2em] text-ink-300 mb-2">
          // PERFORMANCE METRICS (OPTIONAL)
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {(
            [
              ["views", "Views"],
              ["likes", "Likes"],
              ["comments", "Comments"],
              ["shares", "Shares"],
              ["saves", "Saves"],
              ["spend", "Spend ($)"],
              ["conversions", "Conversions"],
            ] as Array<[keyof typeof metrics, string]>
          ).map(([k, label]) => (
            <div key={k}>
              <Label htmlFor={k}>{label}</Label>
              <Input
                id={k}
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={metrics[k]}
                onChange={(e) =>
                  setMetrics((m) => ({ ...m, [k]: e.target.value }))
                }
              />
            </div>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          rows={2}
          placeholder="Anything else you want CREATAI to consider."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      {error && (
        <div className="border border-scan-red bg-[rgba(255,77,77,0.06)] px-3 py-2 cret-mono text-[10px] uppercase tracking-[0.15em] text-scan-red">
          ! {error}
        </div>
      )}

      <div className="flex flex-wrap gap-3 pt-4 border-t border-line-100">
        <Button
          type="button"
          variant="primary"
          size="lg"
          onClick={handleAnalyze}
          disabled={isAnalyzing}
        >
          {isAnalyzing ? "ANALYZING…" : "▶ GENERATE CREATIVE DNA"}
        </Button>
        <span className="cret-mono text-[10px] uppercase tracking-[0.2em] text-ink-400 self-center">
          {isAnalyzing
            ? "← AI is decoding 22 attributes. ~10-30 sec."
            : "← Click when ready. Charge ≈ $0.001-0.01 per analysis."}
        </span>
      </div>
    </div>
  );
}
