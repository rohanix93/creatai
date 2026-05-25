import Link from "next/link";
import { SignupForm } from "./signup-form";
import { TerminalFrame } from "@/components/terminal-frame";

export default function SignupPage() {
  return (
    <div className="w-full max-w-md">
      <TerminalFrame
        title="signup.exe"
        code="0x01"
        status="ONLINE"
        glow="purple"
      >
        <div className="p-6 sm:p-8">
          <div className="cret-mono text-[10px] uppercase tracking-[0.3em] text-scan-red mb-2">
            // new operator registration
          </div>
          <h1 className="cret-display text-4xl text-ink-100 mb-1">
            INITIATE ACCESS
          </h1>
          <p className="text-sm text-ink-300 mb-6">
            Create your CREATAI account to start analyzing.
          </p>

          <SignupForm />

          <div className="mt-6 pt-6 border-t border-line-100 cret-mono text-[10px] uppercase tracking-[0.2em] text-ink-400">
            Already an operator?{" "}
            <Link
              href="/login"
              className="text-scan-red hover:cret-glow-red"
            >
              › Log in
            </Link>
          </div>
        </div>
      </TerminalFrame>
    </div>
  );
}
