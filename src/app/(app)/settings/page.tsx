import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { TerminalFrame } from "@/components/terminal-frame";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="p-6 sm:p-8 max-w-4xl mx-auto">
      <PageHeader
        code="MOD.09 :: OPERATOR_SETTINGS"
        title="SETTINGS"
        subtitle="Account, environment, and integration status."
      />

      <div className="space-y-4">
        <TerminalFrame
          title="account.identity"
          code="A1"
          status="ONLINE"
          glow="green"
        >
          <div className="p-5 grid sm:grid-cols-2 gap-4 cret-mono text-xs">
            <Field label="Operator ID" value={user.id} />
            <Field label="Email" value={user.email ?? "—"} />
            <Field
              label="Created"
              value={
                user.created_at
                  ? new Date(user.created_at).toISOString().slice(0, 10)
                  : "—"
              }
            />
            <Field
              label="Last sign-in"
              value={
                user.last_sign_in_at
                  ? new Date(user.last_sign_in_at).toISOString().slice(0, 16)
                  : "—"
              }
            />
          </div>
        </TerminalFrame>

        <TerminalFrame
          title="integrations.status"
          code="A2"
          status="ONLINE"
          glow="purple"
        >
          <div className="p-5 space-y-3 cret-mono text-xs">
            <StatusRow name="SUPABASE" detail="Auth + Database" status="connected" />
            <StatusRow name="OPENAI" detail="Creative DNA + AI Analyst" status="connected" />
            <StatusRow name="STORAGE" detail="Thumbnails / screenshots" status="phase-3" />
          </div>
        </TerminalFrame>

        <TerminalFrame
          title="account.actions"
          code="A3"
          status="ONLINE"
          glow="blue"
        >
          <div className="p-5 flex flex-wrap gap-3">
            <form action="/auth/signout" method="post">
              <Button type="submit" variant="danger" size="md">
                Sign out
              </Button>
            </form>
          </div>
        </TerminalFrame>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.2em] text-ink-300 mb-1">
        {label}
      </div>
      <div className="text-ink-100 break-all">{value}</div>
    </div>
  );
}

function StatusRow({
  name,
  detail,
  status,
}: {
  name: string;
  detail: string;
  status: "connected" | "phase-3" | "error";
}) {
  return (
    <div className="flex items-center justify-between border border-line-100 px-3 py-2">
      <div>
        <div className="text-ink-100">{name}</div>
        <div className="text-[10px] text-ink-300 uppercase tracking-[0.15em]">
          {detail}
        </div>
      </div>
      {status === "connected" ? (
        <Badge variant="green">● ONLINE</Badge>
      ) : status === "phase-3" ? (
        <Badge variant="amber">PHASE 3</Badge>
      ) : (
        <Badge variant="pink">! ERROR</Badge>
      )}
    </div>
  );
}
