import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppSidebar } from "@/components/app-sidebar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="relative min-h-screen flex">
      <div className="cret-grid absolute inset-0 pointer-events-none opacity-50" />
      <AppSidebar email={user.email ?? undefined} />
      <main className="relative z-10 flex-1 min-w-0 overflow-x-hidden">
        {/* Mobile top bar */}
        <div className="lg:hidden border-b border-line-100 bg-bg-1/80 backdrop-blur-sm px-4 h-12 flex items-center justify-between">
          <span className="cret-display text-2xl text-scan-red cret-glow-red">
            CREATAI
          </span>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="cret-mono text-[10px] uppercase tracking-[0.2em] text-ink-300 hover:text-neon-red"
            >
              sign out
            </button>
          </form>
        </div>
        {children}
      </main>
    </div>
  );
}
