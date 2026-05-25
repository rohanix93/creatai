import { cn } from "@/lib/utils";

export function PageHeader({
  code,
  title,
  subtitle,
  right,
  className,
}: {
  code: string;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-end justify-between gap-4 mb-6 pb-4 border-b border-line-100",
        className
      )}
    >
      <div>
        <div className="cret-mono text-[10px] uppercase tracking-[0.3em] text-neon-purple mb-1">
          // {code}
        </div>
        <h1 className="cret-display text-4xl sm:text-5xl text-ink-100 leading-none">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-ink-300 mt-2 max-w-2xl">{subtitle}</p>
        )}
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </div>
  );
}

export function StatTile({
  label,
  value,
  hint,
  glow = "purple",
}: {
  label: string;
  value: string | number;
  hint?: string;
  glow?: "green" | "purple" | "blue" | "pink";
}) {
  const valueColor =
    glow === "green"
      ? "text-neon-green cret-glow-green"
      : glow === "purple"
        ? "text-neon-purple cret-glow-purple"
        : glow === "blue"
          ? "text-neon-blue cret-glow-blue"
          : "text-neon-pink cret-glow-pink";
  return (
    <div className="relative border border-line-100 bg-bg-1/70 p-4 hover:border-neon-green transition-colors">
      <div className="cret-mono text-[10px] uppercase tracking-[0.2em] text-ink-300 mb-3">
        {label}
      </div>
      <div className={cn("cret-display text-5xl leading-none", valueColor)}>
        {value}
      </div>
      {hint && (
        <div className="cret-mono text-[10px] uppercase tracking-[0.15em] text-ink-400 mt-3">
          {hint}
        </div>
      )}
    </div>
  );
}
