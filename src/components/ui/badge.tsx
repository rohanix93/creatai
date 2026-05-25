import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "green" | "purple" | "blue" | "pink" | "amber" | "muted";

const variantClasses: Record<Variant, string> = {
  green: "border-neon-green text-neon-green bg-[rgba(0,255,157,0.08)]",
  purple: "border-neon-purple text-neon-purple bg-[rgba(168,85,247,0.08)]",
  blue: "border-neon-blue text-neon-blue bg-[rgba(0,212,255,0.08)]",
  pink: "border-neon-pink text-neon-pink bg-[rgba(255,46,146,0.08)]",
  amber: "border-neon-amber text-neon-amber bg-[rgba(255,176,32,0.08)]",
  muted: "border-line-100 text-ink-300 bg-bg-2",
};

export function Badge({
  className,
  variant = "muted",
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: Variant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 cret-mono uppercase text-[10px] tracking-[0.15em] px-2 py-0.5 border",
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
