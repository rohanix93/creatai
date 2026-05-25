"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function RegenerateButton({ disabled }: { disabled?: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        variant="primary"
        size="sm"
        disabled={disabled || pending}
        onClick={() =>
          start(async () => {
            setErr(null);
            const r = await fetch("/api/clusters/regenerate", { method: "POST" });
            const data = await r.json();
            if (!r.ok) {
              setErr(data.error ?? "Failed");
              return;
            }
            router.refresh();
          })
        }
      >
        {pending ? "CLUSTERING…" : "▶ Regenerate clusters"}
      </Button>
      {err && (
        <span className="cret-mono text-[9px] uppercase tracking-[0.15em] text-scan-red">
          ! {err}
        </span>
      )}
    </div>
  );
}
