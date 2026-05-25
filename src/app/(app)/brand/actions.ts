"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const brandSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, "Name required").max(160),
  tagline: z.string().max(280).optional().nullable(),
  mission: z.string().max(2000).optional().nullable(),
  audience: z.string().max(2000).optional().nullable(),
  tone: z.string().max(1000).optional().nullable(),
  products: z.string().max(2000).optional().nullable(),
  usps: z.string().max(2000).optional().nullable(),
});

export type BrandFormState = {
  ok?: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
};

function fd(formData: FormData, key: string) {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim() : "";
}

export async function upsertBrand(
  prev: BrandFormState,
  formData: FormData
): Promise<BrandFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not signed in" };

  const parsed = brandSchema.safeParse({
    id: fd(formData, "id") || undefined,
    name: fd(formData, "name"),
    tagline: fd(formData, "tagline") || null,
    mission: fd(formData, "mission") || null,
    audience: fd(formData, "audience") || null,
    tone: fd(formData, "tone") || null,
    products: fd(formData, "products") || null,
    usps: fd(formData, "usps") || null,
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[String(issue.path[0])] = issue.message;
    }
    return { ok: false, fieldErrors, message: "Fix the highlighted fields" };
  }

  const values = parsed.data;
  const row = {
    owner_id: user.id,
    name: values.name,
    tagline: values.tagline ?? null,
    mission: values.mission ?? null,
    audience: values.audience ?? null,
    tone: values.tone ?? null,
    products: values.products ?? null,
    usps: values.usps ?? null,
  };

  if (values.id) {
    const { error } = await supabase
      .from("brands")
      .update(row)
      .eq("id", values.id)
      .eq("owner_id", user.id);
    if (error) return { ok: false, message: error.message };
  } else {
    const { error } = await supabase.from("brands").insert({ ...row, is_active: true });
    if (error) return { ok: false, message: error.message };
  }

  revalidatePath("/brand");
  revalidatePath("/dashboard");
  return { ok: true, message: "Brand saved" };
}

export async function setActiveBrand(formData: FormData) {
  const id = fd(formData, "id");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase
    .from("brands")
    .update({ is_active: false })
    .eq("owner_id", user.id);
  await supabase
    .from("brands")
    .update({ is_active: true })
    .eq("id", id)
    .eq("owner_id", user.id);

  revalidatePath("/", "layout");
}

export async function deleteBrand(formData: FormData) {
  const id = fd(formData, "id");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase.from("brands").delete().eq("id", id).eq("owner_id", user.id);
  revalidatePath("/brand");
}
