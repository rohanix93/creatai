import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "w-full bg-bg-0 border border-line-100 px-3 py-2 cret-mono text-sm text-ink-100 placeholder:text-ink-400",
      "focus:outline-none focus:border-scan-red focus:cret-box-glow-red",
      "disabled:opacity-50",
      className
    )}
    {...props}
  />
));
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "w-full bg-bg-0 border border-line-100 px-3 py-2 cret-mono text-sm text-ink-100 placeholder:text-ink-400",
      "focus:outline-none focus:border-scan-red focus:cret-box-glow-red",
      "disabled:opacity-50 resize-y",
      className
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      "w-full bg-bg-0 border border-line-100 px-3 py-2 cret-mono text-sm text-ink-100",
      "focus:outline-none focus:border-scan-red",
      "disabled:opacity-50 appearance-none",
      className
    )}
    {...props}
  >
    {children}
  </select>
));
Select.displayName = "Select";
