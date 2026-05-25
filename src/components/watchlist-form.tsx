"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Select } from "@/components/ui/input";
import { Label, FieldError } from "@/components/ui/label";

type Variant = "competitor" | "creator";

export type WatchlistAction = (
  prev: { ok?: boolean; message?: string; fieldErrors?: Record<string, string> },
  formData: FormData
) => Promise<{ ok?: boolean; message?: string; fieldErrors?: Record<string, string> }>;

export function WatchlistForm({
  variant,
  action,
  initial,
}: {
  variant: Variant;
  action: WatchlistAction;
  initial?: {
    id: string;
    name: string;
    platform: string | null;
    handle_or_url: string | null;
    category?: string | null;
    niche?: string | null;
    notes: string | null;
  };
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok && !initial) formRef.current?.reset();
  }, [state.ok, initial]);

  const tagLabel = variant === "competitor" ? "Category" : "Niche";
  const tagName = variant === "competitor" ? "category" : "niche";
  const tagDefault = variant === "competitor" ? initial?.category ?? "" : initial?.niche ?? "";

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      {initial && <input type="hidden" name="id" value={initial.id} />}

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name" required>
            Name
          </Label>
          <Input
            id="name"
            name="name"
            placeholder={variant === "competitor" ? "Competitor name" : "Creator name"}
            defaultValue={initial?.name ?? ""}
            required
          />
          <FieldError message={state.fieldErrors?.name} />
        </div>
        <div>
          <Label htmlFor="platform">Platform</Label>
          <Select id="platform" name="platform" defaultValue={initial?.platform ?? ""}>
            <option value="">—</option>
            <option value="instagram">Instagram</option>
            <option value="tiktok">TikTok</option>
            <option value="youtube">YouTube</option>
            <option value="linkedin">LinkedIn</option>
            <option value="meta_ad">Meta Ad Library</option>
            <option value="other">Other</option>
          </Select>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="handle_or_url">Handle / URL</Label>
          <Input
            id="handle_or_url"
            name="handle_or_url"
            placeholder="@handle or full URL"
            defaultValue={initial?.handle_or_url ?? ""}
          />
        </div>
        <div>
          <Label htmlFor={tagName}>{tagLabel}</Label>
          <Input
            id={tagName}
            name={tagName}
            placeholder={
              variant === "competitor" ? "e.g. fintech, DTC" : "e.g. founder, finance"
            }
            defaultValue={tagDefault}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          name="notes"
          rows={2}
          placeholder="Anything worth remembering."
          defaultValue={initial?.notes ?? ""}
        />
      </div>

      {state.message && (
        <div
          className={
            state.ok
              ? "border border-neon-green bg-[rgba(0,255,157,0.06)] px-3 py-2 cret-mono text-[10px] uppercase tracking-[0.15em] text-neon-green"
              : "border border-scan-red bg-[rgba(255,77,77,0.06)] px-3 py-2 cret-mono text-[10px] uppercase tracking-[0.15em] text-scan-red"
          }
        >
          {state.ok ? "● " : "! "}
          {state.message}
        </div>
      )}

      <Button type="submit" variant="primary" size="md" disabled={pending}>
        {pending ? "SAVING…" : initial ? "▶ UPDATE" : "▶ ADD"}
      </Button>
    </form>
  );
}
