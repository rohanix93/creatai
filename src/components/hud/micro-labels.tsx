/**
 * Decorative micro-readouts — random-looking IDs/timestamps/codes
 * scattered around an interface to suggest depth and density.
 * Deterministic (no randomness on each render) to stay SSR-stable.
 */
const POOL = [
  "7-37317-67",
  "421-AAX-91",
  "ZT11-776",
  "0x41A",
  "455-461",
  "9-90317-90",
  "1-478-77",
  "017-11",
  "33-42",
  "412-3341",
  "211-332",
  "00-37200",
  "5765-1112",
  "MN-433TT4",
  "h-0//me",
  "983-2422",
  "322-561",
  "999-2378",
];

export function MicroLabels({
  count = 6,
  className,
  hue = "purple",
  seed = 0,
}: {
  count?: number;
  className?: string;
  hue?: "green" | "purple" | "blue" | "red" | "muted";
  seed?: number;
}) {
  const color =
    hue === "green"
      ? "text-neon-green"
      : hue === "purple"
        ? "text-neon-purple"
        : hue === "blue"
          ? "text-neon-blue"
          : hue === "red"
            ? "text-scan-red"
            : "text-ink-400";

  const picks = Array.from({ length: count }).map((_, i) => POOL[(i + seed) % POOL.length]);

  return (
    <div
      className={`flex flex-col gap-px cret-mono text-[9px] leading-tight tracking-tight ${color} ${className ?? ""}`}
      aria-hidden
    >
      {picks.map((p, i) => (
        <span key={i}>{p}</span>
      ))}
    </div>
  );
}
