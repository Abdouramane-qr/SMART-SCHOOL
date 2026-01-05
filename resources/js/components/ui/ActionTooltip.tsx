import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTooltips, type TooltipKey } from "@/hooks/useTooltips";
import { ReactNode } from "react";

interface ActionTooltipProps {
  tooltipKey: TooltipKey;
  children: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  delayDuration?: number;
}

export function ActionTooltip({
  tooltipKey,
  children,
  side = "top",
  align = "center",
  delayDuration = 300,
}: ActionTooltipProps) {
  const { getTooltip } = useTooltips();
  const tooltipText = getTooltip(tooltipKey);

  return (
    <TooltipProvider delayDuration={delayDuration}>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent side={side} align={align}>
          <p className="max-w-xs text-sm">{tooltipText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
