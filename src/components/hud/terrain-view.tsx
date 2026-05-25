import { cn } from "@/lib/utils";

/**
 * Mini landscape "view port" — silhouetted mountains, sky gradient, distant planets,
 * targeting reticle in center. Echoes the reference imagery's terrain windows.
 */
export function TerrainView({
  className,
  height = 200,
}: {
  className?: string;
  height?: number;
}) {
  return (
    <div
      className={cn("relative w-full overflow-hidden border border-line-100", className)}
      style={{ height }}
      aria-hidden
    >
      {/* sky gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, #0a0a14 0%, #1a1a2a 30%, #2a1a14 60%, #3a2415 75%, #4a2c18 100%)",
        }}
      />

      {/* stars */}
      <svg className="absolute inset-0" width="100%" height="100%">
        {STARS.map((s, i) => (
          <circle key={i} cx={`${s.x}%`} cy={`${s.y}%`} r={s.r} fill="#fff" opacity={s.o} />
        ))}
      </svg>

      {/* distant planets */}
      <div
        className="absolute"
        style={{
          right: "8%",
          top: "18%",
          width: 42,
          height: 42,
          borderRadius: "50%",
          background: "radial-gradient(circle at 35% 35%, #c97a4a, #6a3a1a)",
          opacity: 0.85,
        }}
      />
      <div
        className="absolute"
        style={{
          right: "28%",
          top: "10%",
          width: 16,
          height: 16,
          borderRadius: "50%",
          background: "#8a5a3a",
          opacity: 0.7,
        }}
      />

      {/* mountain silhouette (SVG path) */}
      <svg
        className="absolute bottom-0 left-0 w-full"
        viewBox="0 0 400 100"
        preserveAspectRatio="none"
        style={{ height: "55%" }}
      >
        <path
          d="M 0 100 L 0 70 L 40 55 L 75 65 L 110 35 L 150 50 L 195 25 L 230 45 L 270 30 L 310 60 L 350 40 L 400 55 L 400 100 Z"
          fill="#1a0a06"
          opacity="0.95"
        />
        <path
          d="M 0 100 L 0 80 L 50 72 L 95 80 L 140 60 L 190 75 L 240 55 L 290 75 L 340 65 L 400 78 L 400 100 Z"
          fill="#0d0604"
          opacity="0.9"
        />
      </svg>

      {/* central targeting reticle */}
      <div className="absolute inset-0 flex items-center justify-center">
        <svg width="90" height="90" viewBox="0 0 90 90" aria-hidden>
          <circle cx="45" cy="45" r="38" fill="none" stroke="var(--scan-red)" strokeWidth="1" opacity="0.9" />
          <circle cx="45" cy="45" r="28" fill="none" stroke="var(--scan-red)" strokeWidth="0.6" strokeDasharray="2 3" opacity="0.7" />
          <line x1="45" y1="0" x2="45" y2="14" stroke="var(--scan-red)" strokeWidth="1.5" />
          <line x1="45" y1="76" x2="45" y2="90" stroke="var(--scan-red)" strokeWidth="1.5" />
          <line x1="0" y1="45" x2="14" y2="45" stroke="var(--scan-red)" strokeWidth="1.5" />
          <line x1="76" y1="45" x2="90" y2="45" stroke="var(--scan-red)" strokeWidth="1.5" />
          <line x1="20" y1="20" x2="70" y2="70" stroke="var(--scan-red)" strokeWidth="0.6" />
          <line x1="70" y1="20" x2="20" y2="70" stroke="var(--scan-red)" strokeWidth="0.6" />
          <polygon points="45,8 41,16 49,16" fill="var(--scan-red)" />
          <circle cx="45" cy="45" r="2" fill="var(--neon-green)" />
        </svg>
      </div>

      {/* corner readouts */}
      <div className="absolute top-2 left-2 cret-mono text-[9px] text-neon-green leading-tight">
        <div>412-3341</div>
        <div>211-332</div>
      </div>
      <div className="absolute top-2 right-2 cret-mono text-[9px] text-scan-red leading-tight text-right">
        <div>333-44</div>
        <div>0111-244</div>
        <div>4-5540</div>
      </div>
      <div className="absolute bottom-2 left-2 cret-mono text-[9px] text-scan-red leading-tight">
        <div>31 / 360</div>
        <div>05 / 33</div>
      </div>
      <div className="absolute bottom-2 right-2 cret-mono text-[9px] text-ink-300 leading-tight text-right">
        <div>RANGE :: 4.2km</div>
        <div>HDG :: 270°</div>
      </div>
    </div>
  );
}

const STARS = [
  { x: 5, y: 8, r: 0.7, o: 0.8 },
  { x: 18, y: 15, r: 0.4, o: 0.5 },
  { x: 38, y: 6, r: 0.8, o: 0.9 },
  { x: 52, y: 22, r: 0.5, o: 0.6 },
  { x: 67, y: 5, r: 0.6, o: 0.8 },
  { x: 78, y: 19, r: 0.4, o: 0.5 },
  { x: 88, y: 8, r: 0.7, o: 0.85 },
  { x: 12, y: 28, r: 0.4, o: 0.45 },
  { x: 25, y: 4, r: 0.5, o: 0.7 },
  { x: 45, y: 16, r: 0.6, o: 0.65 },
  { x: 60, y: 14, r: 0.4, o: 0.4 },
  { x: 96, y: 24, r: 0.5, o: 0.7 },
];
