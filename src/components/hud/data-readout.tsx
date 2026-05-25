import { cn } from "@/lib/utils";

/**
 * A tabular column of label::value readouts.
 * Echoes the dense ID/timestamp columns in the reference HUD imagery.
 */
export function DataReadout({
  rows,
  hue = "muted",
  className,
}: {
  rows: Array<[string, string | number]>;
  hue?: "green" | "purple" | "blue" | "red" | "muted";
  className?: string;
}) {
  const valueColor =
    hue === "green"
      ? "text-neon-green"
      : hue === "purple"
        ? "text-neon-purple"
        : hue === "blue"
          ? "text-neon-blue"
          : hue === "red"
            ? "text-scan-red"
            : "text-ink-200";

  return (
    <div className={cn("cret-mono text-[10px] uppercase tracking-tight", className)}>
      {rows.map(([k, v], i) => (
        <div
          key={i}
          className="grid grid-cols-[1fr_auto] gap-2 leading-tight border-b border-line-100/40 py-0.5"
        >
          <span className="text-ink-400 truncate">{k}</span>
          <span className={cn(valueColor, "text-right tabular-nums")}>{v}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * Compact horizontal progress meter with tick marks.
 */
export function MeterBar({
  value,
  max = 100,
  label,
  hue = "green",
  className,
}: {
  value: number;
  max?: number;
  label?: string;
  hue?: "green" | "purple" | "blue" | "red" | "amber";
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
  const pct = Math.min(100, (value / max) * 100);

  return (
    <div className={cn("w-full", className)}>
      {label && (
        <div className="flex items-baseline justify-between mb-1 cret-mono text-[10px] uppercase tracking-[0.15em]">
          <span className="text-ink-300">{label}</span>
          <span style={{ color }} className="tabular-nums">
            {value}/{max}
          </span>
        </div>
      )}
      <div className="relative h-2 border border-line-100 bg-bg-0">
        <div
          className="absolute inset-y-0 left-0"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${color}, transparent)`,
            opacity: 0.85,
          }}
        />
        {/* tick marks */}
        <div className="absolute inset-0 flex justify-between px-px">
          {Array.from({ length: 11 }).map((_, i) => (
            <div
              key={i}
              className="w-px h-full opacity-30"
              style={{ background: color }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
