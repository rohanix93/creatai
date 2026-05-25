import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 cret-mono uppercase tracking-wider whitespace-nowrap text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed border",
  {
    variants: {
      variant: {
        primary:
          "bg-scan-red text-bg-0 border-scan-red hover:bg-transparent hover:text-scan-red hover:cret-glow-red",
        secondary:
          "bg-transparent text-neon-purple border-neon-purple hover:bg-neon-purple hover:text-bg-0",
        accent:
          "bg-transparent text-neon-blue border-neon-blue hover:bg-neon-blue hover:text-bg-0",
        success:
          "bg-neon-green text-bg-0 border-neon-green hover:bg-transparent hover:text-neon-green hover:cret-glow-green",
        ghost:
          "bg-transparent text-ink-200 border-transparent hover:text-scan-red hover:border-scan-red",
        danger:
          "bg-transparent text-neon-red border-neon-red hover:bg-neon-red hover:text-bg-0",
        outline:
          "bg-bg-1 text-ink-100 border-line-100 hover:border-scan-red hover:text-scan-red",
      },
      size: {
        sm: "h-8 px-3 text-[10px]",
        md: "h-10 px-4 text-xs",
        lg: "h-12 px-6 text-sm",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
);
Button.displayName = "Button";
