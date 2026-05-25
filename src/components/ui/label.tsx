import * as React from "react";
import { cn } from "@/lib/utils";

export function Label({
  className,
  children,
  required,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement> & { required?: boolean }) {
  return (
    <label
      className={cn(
        "block cret-mono uppercase text-[10px] tracking-[0.2em] text-ink-300 mb-1.5",
        className
      )}
      {...props}
    >
      <span className="text-scan-red">{">"}</span> {children}
      {required && <span className="text-neon-pink ml-1">*</span>}
    </label>
  );
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1 cret-mono text-[10px] uppercase tracking-wider text-neon-red">
      ! {message}
    </p>
  );
}

export function FieldHint({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-1 cret-mono text-[10px] text-ink-300">{children}</p>
  );
}
