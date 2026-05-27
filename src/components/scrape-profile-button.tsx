"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { Platform } from "@/lib/types";

interface Props {
  handle: string | null;
  platform: Platform | null;
  brand_id?: string | null;
  competitor_id?: string | null;
  creator_id?: string | null;
  label?: string;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "secondary" | "outline" | "accent" | "ghost";
  /** Refresh the route after success (so library/dashboard counts update) */
  refreshAfter?: boolean;
}

export function ScrapeProfileButton({
  handle,
  platform,
  brand_id,
  competitor_id,
  creator_id,
  label = "▶ Scrape latest posts",
  size = "sm",
  variant = "outline",
  refreshAfter = true,
}: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "warn" | "err"; text: string } | null>(null);

  const disabled = !handle || !platform || pending;

  async function run() {
    if (disabled || !handle || !platform) return;

    // Quick confirm — bulk scrapes hit Apify credits
    const countStr = window.prompt(
      `How many recent posts to pull from "${handle}" on ${platform.toUpperCase()}?`,
      "20"
    );
    if (!countStr) return;
    const count = Math.max(1, Math.min(100, parseInt(countStr, 10) || 20));

    setPending(true);
    setMsg({ type: "ok", text: `Scraping ${count} posts…` });

    try {
      const r = await fetch("/api/extract/profile", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          handle,
          platform,
          count,
          brand_id: brand_id ?? null,
          competitor_id: competitor_id ?? null,
          creator_id: creator_id ?? null,
        }),
      });
      const data = await r.json();
      if (!r.ok || !data.ok) {
        setMsg({
          type: "err",
          text: data.error ?? "Scrape failed",
        });
        return;
      }
      setMsg({
        type: "ok",
        text: `✓ ${data.count} posts added to library`,
      });
      if (refreshAfter) {
        setTimeout(() => router.refresh(), 600);
      }
    } catch {
      setMsg({ type: "err", text: "Network error" });
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        variant={variant}
        size={size}
        disabled={disabled}
        onClick={run}
        title={!handle ? "Add a handle/URL first" : undefined}
      >
        {pending ? "PULLING…" : label}
      </Button>
      {msg && (
        <span
          className={
            "cret-mono text-[9px] uppercase tracking-[0.15em] " +
            (msg.type === "ok"
              ? "text-neon-green"
              : msg.type === "warn"
                ? "text-neon-amber"
                : "text-scan-red")
          }
        >
          {msg.text}
        </span>
      )}
    </div>
  );
}
