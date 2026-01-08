import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useTooltips, type TooltipKey } from "@/hooks/useTooltips";
import { ReactNode } from "react";

interface ActionTooltipProps {
  tooltipKey: TooltipKey;
  children: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
}

export function ActionTooltip({
  tooltipKey,
  children,
  side = "top",
  align = "center",
}: ActionTooltipProps) {
  const { getTooltip } = useTooltips();
  const tooltipText = getTooltip(tooltipKey);

  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side={side} align={align}>
        <p className="max-w-[220px] text-xs leading-snug">{tooltipText}</p>
      </TooltipContent>
    </Tooltip>
  );
}
