"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, "Required").max(160),
  platform: z.string().optional().nullable(),
  handle_or_url: z.string().optional().nullable(),
  niche: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type WatchlistFormState = {
  ok?: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
};

function fd(formData: FormData, key: string) {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim() : "";
}

export async function upsertCreator(
  prev: WatchlistFormState,
  formData: FormData
): Promise<WatchlistFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not signed in" };

  const parsed = schema.safeParse({
    id: fd(formData, "id") || undefined,
    name: fd(formData, "name"),
    platform: fd(formData, "platform") || null,
    handle_or_url: fd(formData, "handle_or_url") || null,
    niche: fd(formData, "niche") || null,
    notes: fd(formData, "notes") || null,
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) fieldErrors[String(i.path[0])] = i.message;
    return { ok: false, fieldErrors, message: "Fix the highlighted fields" };
  }

  const { data: activeBrand } = await supabase
    .from("brands")
    .select("id")
    .eq("owner_id", user.id)
    .eq("is_active", true)
    .maybeSingle();

  const row = {
    owner_id: user.id,
    brand_id: activeBrand?.id ?? null,
    name: parsed.data.name,
    platform: parsed.data.platform,
    handle_or_url: parsed.data.handle_or_url,
    niche: parsed.data.niche,
    notes: parsed.data.notes,
  };

  if (parsed.data.id) {
    const { error } = await supabase
      .from("creators")
      .update(row)
      .eq("id", parsed.data.id)
      .eq("owner_id", user.id);
    if (error) return { ok: false, message: error.message };
  } else {
    const { error } = await supabase.from("creators").insert(row);
    if (error) return { ok: false, message: error.message };
  }
  revalidatePath("/creators");
  return { ok: true, message: "Creator saved" };
}

export async function deleteCreator(formData: FormData) {
  const id = fd(formData, "id");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  await supabase.from("creators").delete().eq("id", id).eq("owner_id", user.id);
  revalidatePath("/creators");
}
