import { macroLabel, macroBadgeColor } from "@/lib/utils";
import type { DominantMacro } from "@/types";
import { cn } from "@/lib/utils";

interface MacroBadgeProps {
  macro: DominantMacro;
  className?: string;
}

export function MacroBadge({ macro, className }: MacroBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        macroBadgeColor(macro),
        className
      )}
    >
      {macroLabel(macro)}
    </span>
  );
}
