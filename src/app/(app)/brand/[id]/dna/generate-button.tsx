"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function GenerateBrandDnaButton({
  brandId,
  disabled,
}: {
  brandId: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        variant="primary"
        size="md"
        disabled={disabled || pending}
        onClick={() =>
          start(async () => {
            setErr(null);
            const r = await fetch(`/api/brand/${brandId}/analyze`, {
              method: "POST",
            });
            const data = await r.json();
            if (!r.ok || !data.ok) {
              setErr(data.error ?? "Failed");
              return;
            }
            router.refresh();
          })
        }
      >
        {pending ? "SYNTHESIZING…" : "▶ Generate brand DNA"}
      </Button>
      {err && (
        <span className="cret-mono text-[9px] uppercase tracking-[0.15em] text-scan-red max-w-xs text-right">
          ! {err}
        </span>
      )}
    </div>
  );
}
