import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "relative inline-flex items-center justify-center rounded-lg border border-transparent text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-60",
  {
    variants: {
      variant: {
        primary: "bg-primary text-background hover:bg-primary/90 focus-visible:ring-primary/60",
        secondary:
          "bg-surface-muted/60 text-text hover:bg-surface-muted focus-visible:ring-accent/60",
        outline:
          "border-border/80 bg-transparent text-text hover:border-primary/70 hover:text-primary focus-visible:ring-primary/60",
        ghost: "bg-transparent text-text-muted hover:text-text hover:bg-surface-muted/60",
        glass:
          "border-white/15 bg-[rgba(17,25,40,0.55)] text-text shadow-[0_15px_40px_rgba(10,20,35,0.45)] backdrop-blur-xl transition-shadow duration-300 hover:border-accent/40 hover:bg-[rgba(17,25,40,0.7)] hover:shadow-[0_22px_55px_rgba(15,35,70,0.55)] active:shadow-[0_14px_32px_rgba(10,20,35,0.45)] focus-visible:ring-accent/50",
        glow:
          "overflow-hidden bg-gradient-to-r from-primary/75 via-accent/70 to-primary/85 text-midnight-900 shadow-[0_20px_48px_rgba(99,218,255,0.45)] transition-shadow duration-300 hover:shadow-[0_28px_64px_rgba(99,218,255,0.6)] active:shadow-[0_18px_40px_rgba(99,218,255,0.5)] focus-visible:ring-accent/70 before:absolute before:inset-[-20%] before:-z-10 before:bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.7),transparent_60%)] before:opacity-0 before:transition-opacity before:duration-500 hover:before:opacity-80"
      },
      size: {
        sm: "h-9 px-4 text-xs",
        md: "h-10 px-4",
        lg: "h-12 px-6 text-base"
      }
    },
    defaultVariants: {
      variant: "primary",
      size: "md"
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size }), className)} ref={ref} {...props} />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
