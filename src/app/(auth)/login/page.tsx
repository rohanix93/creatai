import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "./login-form";
import { TerminalFrame } from "@/components/terminal-frame";

export default function LoginPage() {
  return (
    <div className="w-full max-w-md">
      <TerminalFrame
        title="login.exe"
        code="0x00"
        status="ONLINE"
        glow="purple"
      >
        <div className="p-6 sm:p-8">
          <div className="cret-mono text-[10px] uppercase tracking-[0.3em] text-neon-purple mb-2">
            // operator authentication
          </div>
          <h1 className="cret-display text-4xl text-ink-100 mb-1">
            ACCESS TERMINAL
          </h1>
          <p className="text-sm text-ink-300 mb-6">
            Welcome back, operator.
          </p>

          <Suspense fallback={<div className="cret-mono text-xs text-ink-300">loading…</div>}>
            <LoginForm />
          </Suspense>

          <div className="mt-6 pt-6 border-t border-line-100 cret-mono text-[10px] uppercase tracking-[0.2em] text-ink-400">
            New operator?{" "}
            <Link
              href="/signup"
              className="text-scan-red hover:cret-glow-red"
            >
              › Create account
            </Link>
          </div>
        </div>
      </TerminalFrame>
    </div>
  );
}
