import { cn } from "@/lib/utils";

/**
 * Wireframe sphere — latitude/longitude grid + a few orbiting circles.
 * Pure SVG, rotates slowly.
 */
export function WireframeOrb({
  size = 220,
  hue = "green",
  className,
}: {
  size?: number;
  hue?: "green" | "purple" | "blue" | "red";
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

  const r = size / 2 - 6;
  const c = size / 2;

  // longitude lines via skewed ellipses
  const longitudes = Array.from({ length: 7 }).map((_, i) => {
    const rxFrac = Math.cos((i / 7) * Math.PI);
    return Math.abs(rxFrac) * r;
  });

  // latitude rings
  const latitudes = [0.18, 0.36, 0.55, 0.72].map((f) => f * r);

  return (
    <div
      className={cn("relative", className)}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg
        viewBox={`0 0 ${size} ${size}`}
        width={size}
        height={size}
        className="cret-spin-slow"
      >
        <circle cx={c} cy={c} r={r} fill="none" stroke={color} strokeWidth={0.6} opacity={0.55} />
        {longitudes.map((rx, i) => (
          <ellipse
            key={`lon-${i}`}
            cx={c}
            cy={c}
            rx={rx || 1}
            ry={r}
            fill="none"
            stroke={color}
            strokeWidth={0.5}
            opacity={0.5}
          />
        ))}
        {latitudes.map((ry, i) => (
          <ellipse
            key={`lat-${i}`}
            cx={c}
            cy={c}
            rx={r}
            ry={ry}
            fill="none"
            stroke={color}
            strokeWidth={0.4}
            opacity={0.5}
          />
        ))}
        {/* equator emphasized */}
        <line x1={c - r} y1={c} x2={c + r} y2={c} stroke={color} strokeWidth={0.8} opacity={0.8} />
        {/* orbiting tick markers */}
        {Array.from({ length: 6 }).map((_, i) => {
          const a = (i / 6) * Math.PI * 2;
          const px = c + Math.cos(a) * r;
          const py = c + Math.sin(a) * r * 0.18;
          return (
            <circle
              key={`p-${i}`}
              cx={px}
              cy={py}
              r={1.4}
              fill={color}
              opacity={0.8}
            />
          );
        })}
      </svg>
    </div>
  );
}
