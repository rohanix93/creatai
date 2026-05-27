"use client";

import { useActionState } from "react";
import { upsertBrand, type BrandFormState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label, FieldError, FieldHint } from "@/components/ui/label";
import type { Brand } from "@/lib/types";

export function BrandForm({ brand }: { brand?: Brand | null }) {
  const [state, formAction, pending] = useActionState<BrandFormState, FormData>(
    upsertBrand,
    {}
  );

  return (
    <form action={formAction} className="space-y-5">
      {brand && <input type="hidden" name="id" value={brand.id} />}

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name" required>
            Brand name
          </Label>
          <Input
            id="name"
            name="name"
            placeholder="e.g. CREATAI"
            defaultValue={brand?.name ?? ""}
            required
          />
          <FieldError message={state.fieldErrors?.name} />
        </div>
        <div>
          <Label htmlFor="tagline">Tagline</Label>
          <Input
            id="tagline"
            name="tagline"
            placeholder="e.g. The Creative Intelligence OS"
            defaultValue={brand?.tagline ?? ""}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="mission">Mission</Label>
        <Textarea
          id="mission"
          name="mission"
          rows={2}
          placeholder="What this brand exists to do."
          defaultValue={brand?.mission ?? ""}
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="audience">Audience</Label>
          <Textarea
            id="audience"
            name="audience"
            rows={3}
            placeholder="Who you serve. Demographics, psychographics, jobs-to-be-done."
            defaultValue={brand?.audience ?? ""}
          />
        </div>
        <div>
          <Label htmlFor="tone">Creative tone</Label>
          <Textarea
            id="tone"
            name="tone"
            rows={3}
            placeholder="e.g. Sharp, irreverent, founder-led, no-fluff."
            defaultValue={brand?.tone ?? ""}
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="products">Products / offerings</Label>
          <Textarea
            id="products"
            name="products"
            rows={3}
            placeholder="What you sell. Bullet list is fine."
            defaultValue={brand?.products ?? ""}
          />
        </div>
        <div>
          <Label htmlFor="usps">USPs / differentiation</Label>
          <Textarea
            id="usps"
            name="usps"
            rows={3}
            placeholder="What makes you different. Why anyone should care."
            defaultValue={brand?.usps ?? ""}
          />
          <FieldHint>This is fed into every Creative DNA analysis.</FieldHint>
        </div>
      </div>

      {/* Own social handles (V1.2) — used for bulk self-scrape */}
      <div className="border border-line-100 bg-bg-1/30 p-4">
        <div className="cret-mono text-[10px] uppercase tracking-[0.3em] text-scan-red mb-1">
          // your handles
        </div>
        <p className="text-xs text-ink-300 mb-4">
          Add your social handles so CREATAI can pull and study your own content.
          One-click bulk scrape per handle from the brand list below.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div>
            <Label htmlFor="handle_instagram">Instagram</Label>
            <Input
              id="handle_instagram"
              name="handle_instagram"
              placeholder="@brand or instagram.com/brand"
              defaultValue={brand?.handle_instagram ?? ""}
            />
          </div>
          <div>
            <Label htmlFor="handle_tiktok">TikTok</Label>
            <Input
              id="handle_tiktok"
              name="handle_tiktok"
              placeholder="@brand or tiktok.com/@brand"
              defaultValue={brand?.handle_tiktok ?? ""}
            />
          </div>
          <div>
            <Label htmlFor="handle_youtube">YouTube</Label>
            <Input
              id="handle_youtube"
              name="handle_youtube"
              placeholder="@channel or youtube.com/@channel"
              defaultValue={brand?.handle_youtube ?? ""}
            />
          </div>
          <div>
            <Label htmlFor="handle_linkedin">LinkedIn</Label>
            <Input
              id="handle_linkedin"
              name="handle_linkedin"
              placeholder="username or linkedin.com/in/username"
              defaultValue={brand?.handle_linkedin ?? ""}
            />
          </div>
          <div>
            <Label htmlFor="handle_twitter">X / Twitter</Label>
            <Input
              id="handle_twitter"
              name="handle_twitter"
              placeholder="@brand or x.com/brand"
              defaultValue={brand?.handle_twitter ?? ""}
            />
          </div>
        </div>
      </div>

      {state.message && (
        <div
          className={
            state.ok
              ? "border border-neon-green bg-[rgba(0,255,157,0.06)] px-3 py-2 cret-mono text-[10px] uppercase tracking-[0.15em] text-neon-green"
              : "border border-scan-red bg-[rgba(255,77,77,0.06)] px-3 py-2 cret-mono text-[10px] uppercase tracking-[0.15em] text-scan-red"
          }
        >
          {state.ok ? "● " : "! "} {state.message}
        </div>
      )}

      <div className="flex gap-3">
        <Button type="submit" variant="primary" size="lg" disabled={pending}>
          {pending ? "SAVING…" : brand ? "▶ UPDATE BRAND" : "▶ CREATE BRAND"}
        </Button>
      </div>
    </form>
  );
}
