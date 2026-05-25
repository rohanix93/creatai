import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative min-h-screen flex flex-col">
      <div className="cret-grid absolute inset-0 pointer-events-none opacity-60" />

      <header className="relative z-10 border-b border-line-100 backdrop-blur-sm bg-bg-0/60">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="cret-display text-2xl text-scan-red cret-glow-red">
              CREATAI
            </span>
            <span className="cret-mono text-[10px] text-ink-300 uppercase tracking-[0.25em] hidden sm:inline">
              :: auth_terminal
            </span>
          </Link>
          <span className="cret-mono text-[10px] text-neon-green uppercase tracking-[0.25em]">
            ● secure_channel_active
          </span>
        </div>
      </header>

      <section className="relative z-10 flex-1 flex items-center justify-center px-6 py-10">
        {children}
      </section>
    </main>
  );
}
