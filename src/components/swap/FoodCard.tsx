import type { Food } from "@/types";
import { MacroBadge } from "./MacroBadge";
import { cn } from "@/lib/utils";

interface FoodCardProps {
  food: Food;
  onClick?: (food: Food) => void;
  selected?: boolean;
}

export function FoodCard({ food, onClick, selected }: FoodCardProps) {
  return (
    <button
      onClick={() => onClick?.(food)}
      className={cn(
        "w-full text-left p-3 rounded-[10px] transition-colors border",
        selected
          ? "bg-[#1D3461] border-[#3B82F6]"
          : "bg-[#18181B] border-[#27272A] hover:border-[#3B82F6] hover:bg-[#18181B]"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-[#FAFAFA] truncate">{food.name}</p>
          {food.brand && (
            <p className="text-xs text-[#A1A1AA] mt-0.5">{food.brand}</p>
          )}
        </div>
        <MacroBadge macro={food.dominantMacro} className="flex-shrink-0 mt-0.5" />
      </div>
      <div className="flex gap-3 mt-2 text-xs text-[#A1A1AA]">
        <span>P: {food.protein.toFixed(1)}g</span>
        <span>H: {food.carbs.toFixed(1)}g</span>
        <span>G: {food.fat.toFixed(1)}g</span>
        <span className="ml-auto">{food.calories.toFixed(0)} kcal</span>
      </div>
    </button>
  );
}
