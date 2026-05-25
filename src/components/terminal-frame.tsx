import * as React from "react";
import { cn } from "@/lib/utils";

export function TerminalFrame({
  title,
  code,
  status = "ONLINE",
  glow = "purple",
  children,
  className,
}: {
  title: string;
  code?: string;
  status?: string;
  glow?: "green" | "purple" | "blue" | "red" | "amber" | "none";
  children: React.ReactNode;
  className?: string;
}) {
  const glowClass =
    glow === "green"
      ? "cret-box-glow-green"
      : glow === "purple"
        ? "cret-box-glow-purple"
        : glow === "blue"
          ? "cret-box-glow-blue"
          : glow === "red"
            ? "cret-box-glow-red"
            : glow === "amber"
              ? "cret-box-glow-purple"
              : "border border-line-100";

  const statusColor =
    status === "ONLINE"
      ? "text-neon-green"
      : status === "BUSY"
        ? "text-neon-amber"
        : status === "ERROR"
          ? "text-neon-red"
          : "text-ink-300";

  return (
    <div
      className={cn(
        "relative bg-bg-1/85 backdrop-blur-sm",
        glowClass,
        "cret-scanlines",
        className
      )}
    >
      {/* Title bar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-line-100 bg-bg-2/60">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 bg-neon-red border border-neon-red"></span>
          <span className="inline-block w-2 h-2 bg-neon-amber border border-neon-amber"></span>
          <span className="inline-block w-2 h-2 bg-neon-green border border-neon-green"></span>
          <span className="ml-3 cret-mono uppercase text-[10px] tracking-[0.2em] text-ink-200">
            {title}
          </span>
          {code && (
            <span className="cret-mono text-[10px] text-ink-400">::{code}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "cret-mono text-[10px] uppercase tracking-[0.2em]",
              statusColor
            )}
          >
            ● {status}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="relative z-[1]">{children}</div>
    </div>
  );
}
