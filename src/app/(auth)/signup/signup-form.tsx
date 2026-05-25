"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label, FieldError, FieldHint } from "@/components/ui/label";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Min 8 characters"),
});
type FormValues = z.infer<typeof schema>;

export function SignupForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setServerError(error.message);
      return;
    }
    setDone(true);
    // If email confirmation is OFF in Supabase, session is created immediately
    router.refresh();
    setTimeout(() => router.push("/dashboard"), 600);
  }

  if (done) {
    return (
      <div className="border border-neon-green bg-[rgba(0,255,157,0.06)] p-4 cret-mono text-xs text-ink-200">
        <div className="text-neon-green uppercase tracking-[0.2em] mb-1">
          ● ACCESS GRANTED
        </div>
        Check your email if confirmation is required. Otherwise redirecting…
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="email" required>
          Email
        </Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="operator@creatai.io"
          {...register("email")}
        />
        <FieldError message={errors.email?.message} />
      </div>

      <div>
        <Label htmlFor="password" required>
          Password
        </Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          {...register("password")}
        />
        <FieldError message={errors.password?.message} />
        <FieldHint>8+ characters</FieldHint>
      </div>

      {serverError && (
        <div className="border border-neon-red bg-[rgba(255,56,96,0.06)] px-3 py-2 cret-mono text-[10px] uppercase tracking-[0.15em] text-neon-red">
          ! {serverError}
        </div>
      )}

      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="w-full"
        disabled={isSubmitting}
      >
        {isSubmitting ? "INITIALIZING…" : "▶ CREATE ACCOUNT"}
      </Button>
    </form>
  );
}
