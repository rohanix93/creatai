import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { TerminalFrame } from "@/components/terminal-frame";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function PhasePlaceholder({
  code,
  title,
  subtitle,
  phase,
  bullets,
}: {
  code: string;
  title: string;
  subtitle: string;
  phase: 2 | 3 | 4 | 5;
  bullets: string[];
}) {
  return (
    <div className="p-6 sm:p-8 max-w-4xl mx-auto">
      <PageHeader
        code={code}
        title={title}
        subtitle={subtitle}
        right={<Badge variant="amber">PHASE {phase}</Badge>}
      />

      <TerminalFrame
        title="module.pending"
        code={`P${phase}`}
        status="BUSY"
        glow="purple"
      >
        <div className="p-6">
          <div className="cret-mono text-[10px] uppercase tracking-[0.3em] text-neon-amber mb-3">
            ⚡ Module shipping in Phase {phase}
          </div>
          <p className="text-ink-200 mb-5">
            This screen is part of <span className="text-neon-green">Phase {phase}</span> of the
            CREATAI V1 build. The dashboard shell, auth and theme are live —
            the rest comes online as each phase is implemented.
          </p>

          <div className="cret-mono text-[10px] uppercase tracking-[0.2em] text-ink-300 mb-2">
            // what this module will do
          </div>
          <ul className="space-y-2 mb-6">
            {bullets.map((b) => (
              <li
                key={b}
                className="flex items-start gap-3 text-sm text-ink-200"
              >
                <span className="text-neon-green shrink-0 cret-mono">›</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>

          <div className="flex gap-3">
            <Link href="/dashboard">
              <Button variant="secondary" size="md">
                ← Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </TerminalFrame>
    </div>
  );
}
