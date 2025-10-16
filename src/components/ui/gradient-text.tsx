import * as React from "react";

import { cn } from "@/lib/utils";

interface GradientTextProps extends React.HTMLAttributes<HTMLSpanElement> {
  as?: keyof JSX.IntrinsicElements;
}

export function GradientText({ as: Component = "span", className, ...props }: GradientTextProps) {
  return (
    <Component
      className={cn(
        "bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent",
        className
      )}
      {...props}
    />
  );
}
