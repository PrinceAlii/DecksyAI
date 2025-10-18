import * as React from "react";

import { cn } from "@/lib/utils";

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "group/card relative isolate overflow-hidden rounded-2xl border border-white/10 bg-surface/60 p-6 text-text shadow-[0px_20px_45px_rgba(8,15,28,0.45)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-[0px_30px_70px_rgba(8,15,28,0.6)]",
        "before:pointer-events-none before:absolute before:inset-[-1px] before:-z-10 before:rounded-[inherit] before:bg-gradient-to-r before:from-primary/45 before:via-white/10 before:to-accent/45 before:opacity-75 before:transition-opacity before:duration-500 before:content-[''] hover:before:opacity-100",
        "after:pointer-events-none after:absolute after:inset-0 after:-z-20 after:bg-midnight-900/60 after:blur-2xl after:content-['']",
        className
      )}
      {...props}
    />
  )
);
Card.displayName = "Card";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("relative z-10 space-y-3", className)} {...props} />
  )
);
CardContent.displayName = "CardContent";

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  iconClassName?: string;
}

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, icon, iconClassName, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("relative z-10 flex items-start gap-4", className)}
      {...props}
    >
      {icon && (
        <span className="relative inline-flex size-12 items-center justify-center">
          <span
            aria-hidden
            className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/70 via-accent/60 to-transparent opacity-60 blur-lg transition duration-500 group-hover/card:scale-105 group-hover/card:opacity-100"
          />
          <span
            className={cn(
              "relative inline-flex size-12 items-center justify-center rounded-full border border-white/20 bg-surface/70 text-primary shadow-[0_0_30px_rgba(99,218,255,0.45)] transition duration-300 group-hover/card:border-accent/60 group-hover/card:shadow-[0_0_40px_rgba(99,218,255,0.6)]",
              iconClassName
            )}
          >
            {icon}
          </span>
        </span>
      )}
      <div className="space-y-1">{children}</div>
    </div>
  )
);
CardHeader.displayName = "CardHeader";

export { Card, CardContent, CardHeader };
