"use client";

import { UserMeal, DiaryEntry } from "./DiarioClient";

type Props = {
  meal: UserMeal;
  date: string;
  onAdd: () => void;
  onDelete: (id: string) => void;
  onEdit: (entry: DiaryEntry) => void;
  onSettings: () => void;
  onSugerencias: () => void;
};

export function MealSection({ meal, onAdd, onDelete, onEdit, onSettings, onSugerencias }: Props) {
  const mealKcal = meal.entries.reduce((s, e) => s + e.kcal, 0);
  const mealProtein = meal.entries.reduce((s, e) => s + e.protein, 0);
  const mealCarbs = meal.entries.reduce((s, e) => s + e.carbs, 0);
  const mealFat = meal.entries.reduce((s, e) => s + e.fat, 0);

  const hasTargets = meal.targetProtein !== null || meal.targetCarbs !== null || meal.targetFat !== null;

  // Calculate remaining macros
  const remaining = {
    protein: meal.targetProtein !== null ? Math.max(0, meal.targetProtein - mealProtein) : null,
    carbs: meal.targetCarbs !== null ? Math.max(0, meal.targetCarbs - mealCarbs) : null,
    fat: meal.targetFat !== null ? Math.max(0, meal.targetFat - mealFat) : null,
  };

  // Show bulb only if at least one macro has remaining > 0
  const showBulb = hasTargets && (
    (remaining.protein !== null && remaining.protein > 0.5) ||
    (remaining.carbs !== null && remaining.carbs > 0.5) ||
    (remaining.fat !== null && remaining.fat > 0.5)
  );

  return (
    <div className="rounded-xl bg-[#18181B] border border-[#27272A] overflow-hidden">
      {/* Meal header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#27272A]">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <button
            onClick={onSettings}
            className="text-[#A1A1AA] hover:text-white transition-colors flex-shrink-0"
            title="Configurar comida"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          <span className="font-semibold text-white text-sm truncate">{meal.name}</span>
          {meal.entries.length > 0 && (
            <span className="text-xs text-[#A1A1AA] flex-shrink-0">· {Math.round(mealKcal)} kcal</span>
          )}
          {showBulb && (
            <button
              onClick={onSugerencias}
              className="flex-shrink-0 text-yellow-400 hover:text-yellow-300 transition-colors"
              title="Sugerencias para completar macros"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2a7 7 0 00-3.5 13.07V17a1 1 0 001 1h5a1 1 0 001-1v-1.93A7 7 0 0012 2zm-1 14v-1h2v1h-2zm2.5-2.5h-3A5 5 0 017 8.5a5 5 0 0110 0 5 5 0 01-3.5 5z" />
                <rect x="9" y="19" width="6" height="1" rx="0.5" fill="currentColor" />
                <rect x="10" y="21" width="4" height="1" rx="0.5" fill="currentColor" />
              </svg>
            </button>
          )}
        </div>
        <button
          onClick={onAdd}
          className="flex items-center gap-1 text-xs text-[#3DD6E0] hover:text-white font-medium transition-colors px-2 py-1 rounded-lg hover:bg-[#27272A] flex-shrink-0"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Añadir
        </button>
      </div>

      {/* Target macros bar */}
      {hasTargets && (
        <div className="px-4 py-2 bg-[#09090B]/30 border-b border-[#27272A] flex gap-3 flex-wrap">
          {meal.targetProtein !== null && (
            <TargetBar label="P" logged={mealProtein} target={meal.targetProtein} color="#D4175A" />
          )}
          {meal.targetCarbs !== null && (
            <TargetBar label="HC" logged={mealCarbs} target={meal.targetCarbs} color="#3DD6E0" />
          )}
          {meal.targetFat !== null && (
            <TargetBar label="G" logged={mealFat} target={meal.targetFat} color="#F59E0B" />
          )}
          {meal.targetKcal !== null && (
            <TargetBar label="kcal" logged={mealKcal} target={meal.targetKcal} color="#A1A1AA" />
          )}
        </div>
      )}

      {/* Food entries */}
      {meal.entries.length === 0 ? (
        <div className="px-4 py-3 text-xs text-[#52525B] italic">Sin alimentos registrados</div>
      ) : (
        <div className="divide-y divide-[#27272A]">
          {meal.entries.map((entry) => (
            <FoodRow key={entry.id} entry={entry} onDelete={onDelete} onEdit={onEdit} />
          ))}
        </div>
      )}

      {/* Meal macro summary */}
      {meal.entries.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-2 bg-[#09090B]/40 border-t border-[#27272A]">
          <MacroMini label="P" value={mealProtein} color="#D4175A" />
          <MacroMini label="HC" value={mealCarbs} color="#3DD6E0" />
          <MacroMini label="G" value={mealFat} color="#F59E0B" />
        </div>
      )}
    </div>
  );
}

function TargetBar({ label, logged, target, color }: { label: string; logged: number; target: number; color: string }) {
  const pct = Math.min(100, (logged / target) * 100);
  const done = logged >= target * 0.95;
  return (
    <div className="flex items-center gap-1.5 flex-1 min-w-[60px]">
      <span className="text-[10px] font-bold flex-shrink-0" style={{ color }}>{label}</span>
      <div className="flex-1 h-1.5 bg-[#27272A] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: done ? "#22C55E" : color }}
        />
      </div>
      <span className="text-[10px] text-[#A1A1AA] flex-shrink-0 tabular-nums">
        {Math.round(logged)}/{Math.round(target)}
      </span>
    </div>
  );
}

function FoodRow({ entry, onDelete, onEdit }: { entry: DiaryEntry; onDelete: (id: string) => void; onEdit: (entry: DiaryEntry) => void }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white truncate font-medium">{entry.name}</p>
        <p className="text-xs text-[#A1A1AA] mt-0.5">
          {entry.brand ? `${entry.brand} · ` : ""}{entry.grams}g · {Math.round(entry.kcal)} kcal
        </p>
        <div className="flex gap-2 mt-1">
          <span className="text-[10px] text-[#D4175A]">{entry.protein.toFixed(1)}g P</span>
          <span className="text-[10px] text-[#3DD6E0]">{entry.carbs.toFixed(1)}g HC</span>
          <span className="text-[10px] text-[#F59E0B]">{entry.fat.toFixed(1)}g G</span>
        </div>
      </div>
      <div className="flex gap-1 flex-shrink-0">
        <button
          onClick={() => onEdit(entry)}
          className="p-1.5 rounded-lg text-[#A1A1AA] hover:text-[#3DD6E0] hover:bg-[#27272A] transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button
          onClick={() => onDelete(entry.id)}
          className="p-1.5 rounded-lg text-[#A1A1AA] hover:text-red-400 hover:bg-[#27272A] transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function MacroMini({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <span className="text-[10px] font-medium" style={{ color }}>
      {label} {value.toFixed(1)}g
    </span>
  );
}
