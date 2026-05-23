import * as React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "primary" | "accent" | "warning" | "success" | "destructive" | "muted";
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => {
    const variants = {
      default: "bg-[#27272A] text-[#FAFAFA]",
      primary: "bg-[#3B82F6]/20 text-[#3B82F6]",
      accent: "bg-[#EC4899]/20 text-[#EC4899]",
      warning: "bg-[#F59E0B]/20 text-[#F59E0B]",
      success: "bg-[#22C55E]/20 text-[#22C55E]",
      destructive: "bg-[#EF4444]/20 text-[#EF4444]",
      muted: "bg-[#27272A] text-[#A1A1AA]",
    };
    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
          variants[variant],
          className
        )}
        {...props}
      />
    );
  }
);
Badge.displayName = "Badge";

export { Badge };
