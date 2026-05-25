import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HudDial } from "@/components/hud/hud-dial";
import { WireframeOrb } from "@/components/hud/wireframe-orb";
import { HexGrid } from "@/components/hud/hex-grid";
import { CircuitFrame } from "@/components/hud/circuit-frame";
import { MicroLabels } from "@/components/hud/micro-labels";
import { SliderRack } from "@/components/hud/slider-rack";
import { TerrainView } from "@/components/hud/terrain-view";
import { DataReadout, MeterBar } from "@/components/hud/data-readout";

export default function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden">
      {/* Grid + hex overlays */}
      <div className="cret-grid absolute inset-0 pointer-events-none opacity-50" />
      <HexGrid className="inset-0" opacity={0.12} hue="purple" />

      {/* Top ticker */}
      <div className="relative z-10 border-b border-line-100 bg-bg-0/80 backdrop-blur-sm overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 h-6 flex items-center cret-mono text-[10px] uppercase tracking-[0.25em] text-ink-400 gap-8">
          <span className="text-neon-green">● LIVE</span>
          <span>CREATAI :: NODE_001</span>
          <span className="hidden sm:inline">UPTIME 99.998%</span>
          <span className="hidden md:inline">LAT 7ms</span>
          <span className="hidden md:inline">REGION us-west</span>
          <span className="text-neon-purple ml-auto">v1.0.0 // build #001</span>
        </div>
      </div>

      {/* Nav */}
      <header className="relative z-10 border-b border-line-100 backdrop-blur-sm bg-bg-0/60">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <span className="cret-display text-2xl text-scan-red cret-glow-red">
              CREATAI
            </span>
            <span className="cret-mono text-[10px] text-ink-300 uppercase tracking-[0.25em] hidden sm:inline">
              :: creative_intelligence_os
            </span>
          </Link>
          <nav className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Log in
              </Button>
            </Link>
            <Link href="/signup">
              <Button variant="primary" size="sm">
                Start analyzing →
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-12 pb-20">
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* LEFT — copy */}
          <div className="lg:col-span-7 relative">
            {/* floating micro-labels */}
            <div className="absolute -left-4 top-0 hidden lg:block">
              <MicroLabels count={4} hue="muted" seed={0} />
            </div>
            <div className="absolute -left-4 top-44 hidden lg:block">
              <MicroLabels count={3} hue="red" seed={3} />
            </div>

            <div className="flex items-center gap-2 mb-6 flex-wrap">
              <Badge variant="green">● SYSTEM ONLINE</Badge>
              <Badge variant="purple">v1.0 // INTEL</Badge>
              <Badge variant="pink">CLASSIFIED</Badge>
              <span className="cret-mono text-[10px] text-ink-400 ml-2">
                :: 7-37317-67
              </span>
            </div>

            <h1 className="cret-display text-7xl sm:text-8xl lg:text-9xl text-ink-100 leading-[0.9] mb-2">
              <span className="text-scan-red cret-glow-red">CREATAI</span>
            </h1>
            <p className="cret-mono uppercase tracking-[0.3em] text-xs text-neon-purple mb-8 cret-glow-purple">
              The Creative Intelligence OS
            </p>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-medium text-ink-100 leading-tight mb-6">
              Turn content, ads, creators and competitors into{" "}
              <span className="text-scan-red cret-glow-red">
                creative intelligence
              </span>
              .
            </h2>

            <p className="text-lg text-ink-200 max-w-2xl mb-8 leading-relaxed">
              Understand what works, why it works, and what to create next.
              Brands, creators, agencies and startups use CREATAI to decode the
              creative DNA of every piece of content they touch.
            </p>

            <div className="flex flex-wrap gap-3 mb-10">
              <Link href="/signup">
                <Button variant="primary" size="lg">
                  ▶ Start analyzing
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="secondary" size="lg">
                  Login
                </Button>
              </Link>
            </div>

            <div className="cret-mono text-[10px] uppercase tracking-[0.2em] text-ink-400 flex flex-wrap gap-x-6 gap-y-1 border-t border-line-100 pt-4">
              <span>// no credit card required</span>
              <span>// connect supabase</span>
              <span>// powered by openai</span>
            </div>
          </div>

          {/* RIGHT — dense command-center */}
          <div className="lg:col-span-5">
            <div className="relative bg-bg-1/85 backdrop-blur-sm cret-box-glow-purple cret-scanlines">
              {/* corner circuits */}
              <CircuitFrame corner="tl" hue="purple" />
              <CircuitFrame corner="tr" hue="green" />
              <CircuitFrame corner="bl" hue="purple" />
              <CircuitFrame corner="br" hue="red" />

              {/* title bar */}
              <div className="flex items-center justify-between px-3 py-2 border-b border-line-100 bg-bg-2/60">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-scan-red border border-scan-red" />
                  <span className="w-2 h-2 bg-neon-amber border border-neon-amber" />
                  <span className="w-2 h-2 bg-neon-green border border-neon-green cret-pulse" />
                  <span className="ml-3 cret-mono uppercase text-[10px] tracking-[0.2em] text-ink-200">
                    dna_analysis.run
                  </span>
                  <span className="cret-mono text-[10px] text-ink-400">::0x41A</span>
                </div>
                <span className="cret-mono text-[10px] uppercase tracking-[0.2em] text-neon-green">
                  ● ONLINE
                </span>
              </div>

              {/* terrain viewport */}
              <div className="px-3 pt-3">
                <TerrainView height={170} />
              </div>

              {/* dials row */}
              <div className="px-3 py-4 grid grid-cols-3 gap-2 border-b border-line-100">
                <div className="flex flex-col items-center">
                  <HudDial size={88} value="87" label="DNA" hue="green" />
                </div>
                <div className="flex flex-col items-center">
                  <HudDial size={88} value="92" label="HOOK" hue="purple" />
                </div>
                <div className="flex flex-col items-center">
                  <HudDial size={88} value="74" label="RETN" hue="red" />
                </div>
              </div>

              {/* readout + slider */}
              <div className="px-3 py-3 grid grid-cols-[1fr_auto] gap-3 border-b border-line-100">
                <DataReadout
                  hue="green"
                  rows={[
                    ["HOOK_STYLE", "contrarian"],
                    ["EMOTION", "disbelief"],
                    ["TERRITORY", "money_mist."],
                    ["FAMILY", "MME"],
                    ["SCORE", "87/100"],
                  ]}
                />
                <SliderRack bars={6} hue="red" height={84} />
              </div>

              {/* meters */}
              <div className="px-3 py-3 space-y-2 border-b border-line-100">
                <MeterBar label="ENGAGE" value={84} hue="green" />
                <MeterBar label="NOVELTY" value={61} hue="purple" />
                <MeterBar label="CONVERT" value={73} hue="blue" />
              </div>

              {/* mini terminal log */}
              <div className="px-3 py-3 cret-mono text-[10px] space-y-1">
                <div className="text-ink-300">
                  <span className="text-neon-green">$</span> creatai cluster --top 3
                </div>
                <div className="text-ink-200">
                  01│ <span className="text-neon-green">FOUNDER_CONFESSION ↑</span>
                </div>
                <div className="text-ink-200">
                  02│ <span className="text-neon-amber">UGC_PRODUCT_PROOF →</span>
                </div>
                <div className="text-ink-200">
                  03│ <span className="text-neon-green">CONTRARIAN_HOTTAKE ↑</span>
                </div>
                <div className="text-ink-300">
                  <span className="text-neon-purple">$</span>{" "}
                  <span className="cret-blink">█</span>
                </div>
              </div>
            </div>

            {/* satellite widgets below */}
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div className="relative border border-line-100 bg-bg-1/70 p-3 flex items-center gap-3">
                <WireframeOrb size={70} hue="green" />
                <div>
                  <div className="cret-mono text-[9px] uppercase tracking-[0.2em] text-ink-400">
                    network
                  </div>
                  <div className="cret-display text-2xl text-neon-green cret-glow-green">
                    PUBLIC
                  </div>
                  <div className="cret-mono text-[9px] uppercase tracking-[0.15em] text-ink-300">
                    SCANNING 4 PLATFORMS
                  </div>
                </div>
              </div>

              <div className="relative border border-line-100 bg-bg-1/70 p-3">
                <div className="cret-mono text-[9px] uppercase tracking-[0.2em] text-ink-400 mb-1">
                  pattern_density
                </div>
                <SliderRack bars={12} hue="purple" height={50} />
                <div className="cret-mono text-[9px] uppercase tracking-[0.15em] text-neon-purple mt-1">
                  12 ATTRIBUTES TRACKED
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Capabilities grid */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pb-24">
        <div className="flex items-end justify-between mb-6">
          <div>
            <div className="cret-mono uppercase text-[10px] tracking-[0.3em] text-ink-300 mb-2">
              // capabilities
            </div>
            <h3 className="cret-display text-4xl text-ink-100">
              INTELLIGENCE MODULES{" "}
              <span className="text-scan-red cret-glow-red cret-blink">_</span>
            </h3>
          </div>
          <MicroLabels count={4} hue="muted" seed={2} className="hidden sm:flex" />
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {MODULES.map((m, i) => (
            <div
              key={m.code}
              className="relative border border-line-100 bg-bg-1/60 p-5 hover:border-neon-green transition-colors group overflow-hidden"
            >
              <CircuitFrame corner="br" hue="purple" size={50} />
              <div className="absolute top-2 right-2">
                <HudDial
                  size={38}
                  hue={i % 3 === 0 ? "green" : i % 3 === 1 ? "purple" : "red"}
                  spin
                />
              </div>

              <div className="flex items-center justify-between mb-3 pr-12">
                <span className="cret-mono text-[10px] text-ink-400 tracking-[0.2em]">
                  {m.code}
                </span>
                <span className="cret-mono text-[10px] text-neon-green flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-neon-green cret-pulse" />
                  READY
                </span>
              </div>
              <div className="cret-display text-2xl text-ink-100 mb-2 group-hover:text-neon-green transition-colors">
                {m.title}
              </div>
              <p className="text-sm text-ink-200 leading-relaxed">{m.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA strip */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pb-20">
        <div className="relative border border-scan-red bg-bg-1/80 p-10 cret-box-glow-red cret-corners overflow-hidden">
          <CircuitFrame corner="tl" hue="red" size={80} />
          <CircuitFrame corner="br" hue="purple" size={80} />
          <div className="absolute right-4 top-4 hidden md:block">
            <HudDial size={70} hue="red" />
          </div>

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative">
            <div>
              <div className="cret-mono uppercase text-[10px] tracking-[0.3em] text-scan-red mb-2">
                // ready when you are
              </div>
              <h4 className="cret-display text-4xl text-ink-100 mb-1">
                Decode your next winning creative.
              </h4>
              <p className="text-ink-200">
                Paste a link. Get a Creative DNA Report in seconds.
              </p>
            </div>
            <Link href="/signup">
              <Button variant="primary" size="lg">
                ▶ Start analyzing
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="relative z-10 border-t border-line-100 py-6">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between cret-mono text-[10px] uppercase tracking-[0.2em] text-ink-400 gap-4 flex-wrap">
          <span>© CREATAI :: All systems operational</span>
          <span className="hidden sm:inline">7-37317-67 :: 421-AAX-91</span>
          <span>v1.0.0 · build #001</span>
        </div>
      </footer>
    </main>
  );
}

const MODULES = [
  {
    code: "MOD.01",
    title: "Creative DNA",
    body: "Decompose any piece of content into 22 attributes: hook, emotion, territory, format, psychological trigger, and more.",
  },
  {
    code: "MOD.02",
    title: "Content Library",
    body: "Every analysis saved, searchable, filterable. Build the institutional memory your team never had.",
  },
  {
    code: "MOD.03",
    title: "Creative Clusters",
    body: "Group content into creative families. See which patterns are winning before your competitors do.",
  },
  {
    code: "MOD.04",
    title: "Competitor Watchlist",
    body: "Track competitors and creators. Spot their breakouts and tactical shifts the moment they happen.",
  },
  {
    code: "MOD.05",
    title: "Trend Radar",
    body: "Surface trending hooks, emotions, and content territories. Identify underserved opportunity space.",
  },
  {
    code: "MOD.06",
    title: "AI Analyst",
    body: "Chat with your data. Ask what to create next, which family is winning, why something underperformed.",
  },
];
