import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({
  className,
  glow,
  corners,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  glow?: "green" | "purple" | "blue" | "none";
  corners?: boolean;
}) {
  const glowClass =
    glow === "green"
      ? "cret-box-glow-green"
      : glow === "purple"
        ? "cret-box-glow-purple"
        : glow === "blue"
          ? "cret-box-glow-blue"
          : "border border-line-100";
  return (
    <div
      className={cn(
        "relative bg-bg-1/80 backdrop-blur-sm",
        glowClass,
        corners && "cret-corners",
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex items-center justify-between px-4 py-3 border-b border-line-100 cret-mono uppercase text-[10px] tracking-[0.2em] text-ink-300",
        className
      )}
      {...props}
    />
  );
}

export function CardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        "cret-mono uppercase text-[10px] tracking-[0.2em] text-ink-300",
        className
      )}
      {...props}
    />
  );
}

export function CardBody({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-4 sm:p-5", className)} {...props} />;
}

export function CardFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "px-4 py-3 border-t border-line-100 flex items-center justify-between",
        className
      )}
      {...props}
    />
  );
}
