import type { RecipeAlternativa } from "@/types";
import { RecetaMacrosSummary } from "./RecetaMacrosSummary";
import { roundGrams } from "@/lib/utils";

interface AlternativasListProps {
  alternativas: RecipeAlternativa[];
}

export function AlternativasList({ alternativas }: AlternativasListProps) {
  if (alternativas.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-[#A1A1AA] px-1">
        {alternativas.length} alternativas encontradas
      </p>
      {alternativas.map((alt, i) => (
        <div
          key={alt.id}
          className="bg-[#18181B] border border-[#27272A] rounded-[12px] overflow-hidden"
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-[#27272A] flex items-center justify-between">
            <p className="text-sm font-semibold text-[#FAFAFA]">
              Opción {i + 1}
            </p>
            <span className="text-xs text-[#22C55E] bg-[#22C55E]/10 px-2 py-0.5 rounded-full">
              {alt.diffScore === 0 ? "exacto" : `±${alt.diffScore}% macros`}
            </span>
          </div>

          {/* Foods */}
          <div className="p-4 flex flex-col gap-2">
            {alt.foods.map((item, j) => (
              <div key={j} className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-[#FAFAFA] truncate">{item.food.name}</p>
                  {item.food.brand && (
                    <p className="text-xs text-[#A1A1AA]">{item.food.brand}</p>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-lg font-extrabold text-[#FAFAFA]">
                    {roundGrams(item.quantity)}
                  </span>
                  <span className="text-xs text-[#A1A1AA] ml-0.5">g</span>
                </div>
              </div>
            ))}
          </div>

          {/* Macros summary */}
          <div className="px-4 pb-4">
            <RecetaMacrosSummary macros={alt.totalMacros} label="Macros alternativa" />
          </div>
        </div>
      ))}
    </div>
  );
}
