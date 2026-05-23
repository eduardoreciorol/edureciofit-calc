import * as React from "react";
import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, leftIcon, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-sm font-medium text-[#FAFAFA]">{label}</label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A1A1AA]">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              "w-full h-10 rounded-[8px] bg-[#18181B] border border-[#27272A] px-3 text-sm text-[#FAFAFA] placeholder:text-[#A1A1AA]",
              "focus:outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "transition-colors",
              leftIcon && "pl-9",
              error && "border-[#EF4444] focus:border-[#EF4444] focus:ring-[#EF4444]/20",
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-[#EF4444]">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
