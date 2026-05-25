import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { extractFromUrl } from "@/lib/extract";

export const runtime = "nodejs"; // youtube-transcript uses Node APIs

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const url: string = body?.url ?? "";
  if (!url || !/^https?:\/\//i.test(url)) {
    return NextResponse.json({ error: "Provide a valid http(s) URL" }, { status: 400 });
  }

  const result = await extractFromUrl(url);
  return NextResponse.json(result);
}
