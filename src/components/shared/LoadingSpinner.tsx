import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function LoadingSpinner({ className, size = "md" }: LoadingSpinnerProps) {
  const sizes = {
    sm: "h-4 w-4 border-2",
    md: "h-6 w-6 border-2",
    lg: "h-8 w-8 border-[3px]",
  };
  return (
    <div
      className={cn(
        "rounded-full border-[#27272A] border-t-[#3B82F6] animate-spin",
        sizes[size],
        className
      )}
    />
  );
}

export function PageSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <LoadingSpinner size="lg" />
    </div>
  );
}

// ── Skeleton components ───────────────────────────────────────────

export function SkeletonCard() {
  return (
    <div className="rounded-[12px] bg-[#18181B] border border-[#27272A] p-4 animate-pulse">
      <div className="flex gap-3">
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-[#27272A] rounded w-3/4" />
          <div className="h-3 bg-[#27272A] rounded w-1/2" />
        </div>
        <div className="h-8 w-16 bg-[#27272A] rounded" />
      </div>
      <div className="mt-3 flex gap-2">
        <div className="h-3 bg-[#27272A] rounded w-16" />
        <div className="h-3 bg-[#27272A] rounded w-16" />
        <div className="h-3 bg-[#27272A] rounded w-16" />
      </div>
    </div>
  );
}
