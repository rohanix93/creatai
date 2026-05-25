import { cn } from "@/lib/utils";

/**
 * Vertical equalizer-style bars — purely decorative.
 * Deterministic heights so SSR doesn't mismatch.
 */
export function SliderRack({
  bars = 8,
  hue = "red",
  height = 80,
  className,
  pattern = [40, 70, 30, 85, 55, 25, 65, 45, 80, 35, 60, 50],
}: {
  bars?: number;
  hue?: "green" | "purple" | "blue" | "red" | "amber";
  height?: number;
  className?: string;
  pattern?: number[];
}) {
  const color =
    hue === "green"
      ? "var(--neon-green)"
      : hue === "purple"
        ? "var(--neon-purple)"
        : hue === "blue"
          ? "var(--neon-blue)"
          : hue === "amber"
            ? "var(--neon-amber)"
            : "var(--scan-red)";

  return (
    <div
      className={cn("flex items-end gap-1", className)}
      style={{ height }}
      aria-hidden
    >
      {Array.from({ length: bars }).map((_, i) => {
        const v = pattern[i % pattern.length];
        return (
          <div key={i} className="relative flex flex-col items-center gap-0.5 w-2">
            <div
              className="w-full"
              style={{
                height: `${v}%`,
                background: `linear-gradient(to top, ${color}, transparent)`,
                opacity: 0.85,
              }}
            />
            <div
              className="w-full h-px"
              style={{ background: color, opacity: 0.4 }}
            />
            <div
              className="w-full h-px"
              style={{ background: color, opacity: 0.25 }}
            />
          </div>
        );
      })}
    </div>
  );
}
