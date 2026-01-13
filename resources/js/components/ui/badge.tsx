import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-primary/20 bg-primary/10 text-primary hover:bg-primary/20",
        secondary: "border-border bg-card text-foreground hover:bg-muted",
        destructive: "border-destructive/20 bg-destructive/10 text-destructive hover:bg-destructive/20",
        success: "border-success/20 bg-success/10 text-success hover:bg-success/20",
        warning: "border-warning/30 bg-warning/15 text-warning-foreground hover:bg-warning/20",
        info: "border-info/20 bg-info/10 text-info hover:bg-info/20",
        "brand-tint": "border-primary/20 bg-gradient-card text-foreground hover:shadow-sm",
        outline: "border-border bg-card/60 text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
