import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function EmptyState({ title, description, icon, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 px-6 text-center",
        className
      )}
    >
      {icon && (
        <div className="mb-4 text-[#3F3F46] text-5xl">{icon}</div>
      )}
      <p className="text-[#FAFAFA] font-semibold text-base mb-1">{title}</p>
      {description && (
        <p className="text-[#A1A1AA] text-sm leading-relaxed max-w-xs">{description}</p>
      )}
    </div>
  );
}
