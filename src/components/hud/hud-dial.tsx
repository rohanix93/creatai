import { cn } from "@/lib/utils";

/**
 * Concentric tick-mark dial. Decorative + can display a value.
 * Layers: outer tick ring, inner tick ring, center hex, optional needle, optional value text.
 */
export function HudDial({
  size = 160,
  value,
  label,
  hue = "green",
  spin = true,
  className,
}: {
  size?: number;
  value?: string | number;
  label?: string;
  hue?: "green" | "purple" | "blue" | "red" | "amber";
  spin?: boolean;
  className?: string;
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

  const r = size / 2;
  const outerR = r - 4;
  const midR = r - 18;
  const innerR = r - 36;

  const tickMarks = (radius: number, count: number, length: number, opacity = 0.9) =>
    Array.from({ length: count }).map((_, i) => {
      const a = (i / count) * Math.PI * 2;
      const x1 = r + Math.cos(a) * radius;
      const y1 = r + Math.sin(a) * radius;
      const x2 = r + Math.cos(a) * (radius - length);
      const y2 = r + Math.sin(a) * (radius - length);
      return (
        <line
          key={i}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={color}
          strokeWidth={1}
          opacity={i % 5 === 0 ? 1 : opacity * 0.45}
        />
      );
    });

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox={`0 0 ${size} ${size}`}
        width={size}
        height={size}
        className={cn("absolute inset-0", spin && "cret-spin-slow")}
        aria-hidden
      >
        {/* outer arc */}
        <circle cx={r} cy={r} r={outerR} fill="none" stroke={color} strokeWidth={0.8} opacity={0.5} />
        {tickMarks(outerR, 60, 6)}
        {/* dashed mid arc */}
        <circle
          cx={r}
          cy={r}
          r={midR}
          fill="none"
          stroke={color}
          strokeWidth={0.6}
          strokeDasharray="2 4"
          opacity={0.7}
        />
        {/* targeting arcs (3 segments) */}
        <path
          d={describeArc(r, r, midR - 2, -60, 60)}
          fill="none"
          stroke={color}
          strokeWidth={2}
        />
        <path
          d={describeArc(r, r, midR - 2, 110, 160)}
          fill="none"
          stroke={color}
          strokeWidth={2}
        />
        <path
          d={describeArc(r, r, midR - 2, 200, 250)}
          fill="none"
          stroke={color}
          strokeWidth={2}
        />
      </svg>

      {/* counter-rotating inner */}
      <svg
        viewBox={`0 0 ${size} ${size}`}
        width={size}
        height={size}
        className={cn("absolute inset-0", spin && "cret-spin-rev")}
        aria-hidden
      >
        <circle cx={r} cy={r} r={innerR} fill="none" stroke={color} strokeWidth={0.6} opacity={0.4} />
        {tickMarks(innerR, 30, 4, 0.7)}
        {/* center hex */}
        <polygon
          points={hexPoints(r, r, 10)}
          fill="none"
          stroke={color}
          strokeWidth={1}
        />
      </svg>

      {/* static value layer (not rotated) */}
      {(value !== undefined || label) && (
        <div className="relative z-10 flex flex-col items-center justify-center">
          {value !== undefined && (
            <div
              className="cret-display leading-none"
              style={{
                color,
                fontSize: Math.max(28, size * 0.28),
                textShadow: `0 0 8px ${color}`,
              }}
            >
              {value}
            </div>
          )}
          {label && (
            <div className="cret-mono text-[9px] uppercase tracking-[0.25em] text-ink-300 mt-1">
              {label}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const a = ((angleDeg - 90) * Math.PI) / 180.0;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

function describeArc(cx: number, cy: number, r: number, start: number, end: number) {
  const s = polarToCartesian(cx, cy, r, end);
  const e = polarToCartesian(cx, cy, r, start);
  const large = end - start <= 180 ? "0" : "1";
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 0 ${e.x} ${e.y}`;
}

function hexPoints(cx: number, cy: number, r: number) {
  return Array.from({ length: 6 })
    .map((_, i) => {
      const a = (Math.PI / 3) * i - Math.PI / 6;
      return `${cx + Math.cos(a) * r},${cy + Math.sin(a) * r}`;
    })
    .join(" ");
}
