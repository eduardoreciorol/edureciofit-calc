import type { Macros } from "@/types";

interface RecetaMacrosSummaryProps {
  macros: Macros;
  label?: string;
}

export function RecetaMacrosSummary({ macros, label = "Total receta" }: RecetaMacrosSummaryProps) {
  const bars = [
    { label: "Proteína", value: macros.protein, color: "#EC4899", max: macros.protein + macros.carbs + macros.fat },
    { label: "Hidratos", value: macros.carbs, color: "#3B82F6", max: macros.protein + macros.carbs + macros.fat },
    { label: "Grasa", value: macros.fat, color: "#F59E0B", max: macros.protein + macros.carbs + macros.fat },
  ];
  const total = macros.protein + macros.carbs + macros.fat;

  return (
    <div className="bg-[#18181B] border border-[#27272A] rounded-[12px] p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-[#A1A1AA] font-medium uppercase tracking-wide">{label}</p>
        <p className="text-sm font-semibold text-[#FAFAFA]">
          {macros.calories.toFixed(0)} kcal
        </p>
      </div>

      {/* Macro bars */}
      {total > 0 && (
        <div className="h-2 bg-[#27272A] rounded-full overflow-hidden flex mb-3">
          {bars.map((b) => (
            <div
              key={b.label}
              style={{
                width: `${(b.value / total) * 100}%`,
                backgroundColor: b.color,
              }}
            />
          ))}
        </div>
      )}

      <div className="flex gap-4">
        {bars.map((b) => (
          <div key={b.label} className="flex-1 text-center">
            <p className="text-xs text-[#A1A1AA]">{b.label}</p>
            <p className="text-sm font-bold mt-0.5" style={{ color: b.color }}>
              {b.value.toFixed(1)}g
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
