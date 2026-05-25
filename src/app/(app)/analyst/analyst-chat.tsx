"use client";

import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "What content should I create next?",
  "Which creative family is working best for me?",
  "What hooks should I test?",
  "What content territory is underserved?",
  "Why is my content not performing?",
];

export function AnalystChat() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [threadId, setThreadId] = useState<string | undefined>(undefined);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pending]);

  async function send(text: string) {
    if (!text.trim() || pending) return;
    setError(null);
    setMessages((m) => [...m, { role: "user", content: text }]);
    setInput("");
    setPending(true);
    try {
      const r = await fetch("/api/analyst/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ thread_id: threadId, message: text }),
      });
      const data = await r.json();
      if (!r.ok) {
        setError(data.error ?? "Chat failed");
        return;
      }
      if (data.thread_id) setThreadId(data.thread_id);
      setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
    } catch {
      setError("Network error");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col h-[600px]">
      <div className="flex-1 overflow-y-auto space-y-3 mb-3 pr-1">
        {messages.length === 0 && (
          <div className="border border-line-100 bg-bg-1/40 p-5">
            <div className="cret-mono text-[10px] uppercase tracking-[0.3em] text-neon-purple mb-2">
              // session.boot
            </div>
            <p className="text-ink-200 mb-4 text-sm">
              I've read your brand profile and every Creative DNA report you've saved.
              Ask me anything strategic. Try:
            </p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="border border-line-100 bg-bg-1/60 hover:border-scan-red px-3 py-1.5 cret-mono text-[11px] text-ink-200 hover:text-scan-red transition"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <ChatBubble key={i} msg={m} />
        ))}

        {pending && (
          <div className="flex items-start gap-2">
            <span className="cret-mono text-[10px] uppercase tracking-[0.2em] text-neon-purple shrink-0 w-16 mt-1">
              ANALYST
            </span>
            <div className="flex-1 border border-line-100 bg-bg-1/60 px-4 py-3 cret-mono text-xs text-ink-300">
              <span className="cret-blink">█</span> thinking through your data…
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {error && (
        <div className="mb-2 border border-scan-red bg-[rgba(255,77,77,0.06)] px-3 py-2 cret-mono text-[10px] uppercase tracking-[0.15em] text-scan-red">
          ! {error}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex gap-2 items-end border-t border-line-100 pt-3"
      >
        <Textarea
          placeholder="Type a strategic question…"
          rows={2}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(input);
            }
          }}
          className="flex-1 resize-none"
        />
        <Button type="submit" variant="primary" size="lg" disabled={pending || !input.trim()}>
          ▶ SEND
        </Button>
      </form>
      <div className="cret-mono text-[9px] uppercase tracking-[0.15em] text-ink-400 mt-2">
        ↵ ENTER to send · SHIFT+↵ for newline · session held until you reload
      </div>
    </div>
  );
}

function ChatBubble({ msg }: { msg: Msg }) {
  const isUser = msg.role === "user";
  return (
    <div className="flex items-start gap-2">
      <span
        className={`cret-mono text-[10px] uppercase tracking-[0.2em] shrink-0 w-16 mt-1 ${
          isUser ? "text-scan-red" : "text-neon-purple"
        }`}
      >
        {isUser ? "YOU" : "ANALYST"}
      </span>
      <div
        className={`flex-1 border px-4 py-3 text-sm whitespace-pre-wrap leading-relaxed ${
          isUser
            ? "border-scan-red/60 bg-[rgba(255,77,77,0.04)] text-ink-100"
            : "border-line-100 bg-bg-1/60 text-ink-200"
        }`}
      >
        {msg.content}
      </div>
    </div>
  );
}
