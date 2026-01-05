import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({ title, description, icon: Icon, actions, className }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4", className)}>
      <div className="flex items-center gap-4">
        {Icon && (
          <div className="h-12 w-12 md:h-14 md:w-14 rounded-xl bg-primary/10 flex items-center justify-center shadow-sm">
            <Icon className="h-6 w-6 md:h-8 md:w-8 text-primary" />
          </div>
        )}
        <div>
          <h1 className="text-[26px] md:text-[28px] font-bold text-foreground font-display">{title}</h1>
          {description && (
            <p className="text-sm md:text-base text-muted-foreground mt-1">{description}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
