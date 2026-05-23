import type { EquivalenciaResult } from "@/types";
import { macroBorderClass, roundGrams } from "@/lib/utils";

interface EquivalenciaCardProps {
  result: EquivalenciaResult;
}

export function EquivalenciaCard({ result }: EquivalenciaCardProps) {
  const { food, quantity, macros, matchScore } = result;

  return (
    <div
      className={`bg-[#18181B] border border-[#27272A] border-l-4 rounded-[12px] p-4 transition-colors hover:border-[#3F3F46] ${macroBorderClass(food.dominantMacro)}`}
    >
      {/* Food name + quantity */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-[#FAFAFA] text-[15px] leading-tight">{food.name}</p>
          {food.brand && (
            <p className="text-xs text-[#A1A1AA] mt-0.5">{food.brand}</p>
          )}
        </div>
        {/* The BIG number */}
        <div className="text-right flex-shrink-0">
          <span className="text-[2.5rem] font-extrabold leading-none text-[#FAFAFA]">
            {roundGrams(quantity)}
          </span>
          <span className="text-sm text-[#A1A1AA] ml-1">g</span>
        </div>
      </div>

      {/* Macros breakdown */}
      <div className="flex gap-4 mt-3 text-xs">
        <span className="text-[#EC4899]">
          P <strong>{macros.protein.toFixed(1)}g</strong>
        </span>
        <span className="text-[#3B82F6]">
          H <strong>{macros.carbs.toFixed(1)}g</strong>
        </span>
        <span className="text-[#F59E0B]">
          G <strong>{macros.fat.toFixed(1)}g</strong>
        </span>
        <span className="text-[#A1A1AA] ml-auto">
          {macros.calories.toFixed(0)} kcal
        </span>
      </div>

      {/* Match score */}
      {matchScore < 90 && (
        <div className="mt-2">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1 bg-[#27272A] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#3B82F6] rounded-full"
                style={{ width: `${matchScore}%` }}
              />
            </div>
            <span className="text-[10px] text-[#A1A1AA]">{matchScore}% match</span>
          </div>
        </div>
      )}
    </div>
  );
}
