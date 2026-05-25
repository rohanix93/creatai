import { cn } from "@/lib/utils";

/**
 * Corner circuitry decoration — printed-board-meets-HUD feel.
 * Position absolutely inside a relatively positioned card.
 */
export function CircuitFrame({
  corner = "tl",
  hue = "purple",
  size = 80,
  className,
}: {
  corner?: "tl" | "tr" | "bl" | "br";
  hue?: "green" | "purple" | "blue" | "red";
  size?: number;
  className?: string;
}) {
  const color =
    hue === "green"
      ? "var(--neon-green)"
      : hue === "purple"
        ? "var(--neon-purple)"
        : hue === "blue"
          ? "var(--neon-blue)"
          : "var(--scan-red)";

  const pos =
    corner === "tl"
      ? "top-0 left-0"
      : corner === "tr"
        ? "top-0 right-0 -scale-x-100"
        : corner === "bl"
          ? "bottom-0 left-0 -scale-y-100"
          : "bottom-0 right-0 scale-[-1]";

  return (
    <svg
      className={cn("absolute pointer-events-none", pos, className)}
      width={size}
      height={size}
      viewBox="0 0 80 80"
      aria-hidden
    >
      <g stroke={color} strokeWidth="1" fill="none" opacity="0.7">
        <path d="M 0 18 L 14 18 L 18 14 L 32 14" />
        <path d="M 0 30 L 10 30 L 14 26 L 24 26" />
        <path d="M 6 0 L 6 8 L 10 12 L 10 22" />
        <path d="M 18 0 L 18 6 L 22 10 L 22 18" />
        <rect x="30" y="10" width="6" height="6" />
        <rect x="14" y="34" width="4" height="4" />
        <circle cx="32" cy="32" r="2" />
        <path d="M 36 32 L 50 32" strokeDasharray="2 3" />
      </g>
      <g fill={color} opacity="0.9">
        <rect x="2" y="2" width="2" height="2" />
        <rect x="10" y="2" width="2" height="2" />
      </g>
    </svg>
  );
}
