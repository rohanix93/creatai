import { cn } from "@/lib/utils";

/**
 * Hexagonal grid pattern (decorative, absolute-positioned).
 */
export function HexGrid({
  className,
  hue = "purple",
  opacity = 0.2,
}: {
  className?: string;
  hue?: "green" | "purple" | "blue" | "red";
  opacity?: number;
}) {
  const color =
    hue === "green"
      ? "var(--neon-green)"
      : hue === "purple"
        ? "var(--neon-purple)"
        : hue === "blue"
          ? "var(--neon-blue)"
          : "var(--scan-red)";

  return (
    <svg
      className={cn("absolute pointer-events-none", className)}
      width="100%"
      height="100%"
      aria-hidden
      style={{ opacity }}
    >
      <defs>
        <pattern
          id={`hexp-${hue}`}
          x="0"
          y="0"
          width="28"
          height="32"
          patternUnits="userSpaceOnUse"
          patternTransform="translate(0 0)"
        >
          <polygon
            points="14,2 26,9 26,23 14,30 2,23 2,9"
            fill="none"
            stroke={color}
            strokeWidth="0.5"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#hexp-${hue})`} />
    </svg>
  );
}
