import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        primary: "border-transparent bg-primary/20 text-primary",
        secondary: "border-transparent bg-surface-muted/80 text-text",
        outline: "border-border/60 bg-transparent text-text",
        ghost: "border-transparent bg-transparent text-text-muted",
      },
    },
    defaultVariants: {
      variant: "primary",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(({ className, variant, ...props }, ref) => (
  <span ref={ref} className={cn(badgeVariants({ variant }), className)} {...props} />
));

Badge.displayName = "Badge";

export { Badge, badgeVariants };
