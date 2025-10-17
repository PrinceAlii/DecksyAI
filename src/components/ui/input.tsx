import * as React from "react";

import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type = "text", ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-11 w-full rounded-lg border border-border/70 bg-surface-muted/60 px-4 text-sm text-text placeholder:text-text-muted",
        "focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40",
        "data-[invalid=true]:border-danger/70 data-[invalid=true]:ring-2 data-[invalid=true]:ring-danger/30",
        "data-[invalid=true]:focus:border-danger data-[invalid=true]:focus:ring-danger/40",
        "disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});

Input.displayName = "Input";

export { Input };
