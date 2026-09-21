"use client";

import { DiaryEntry } from "./DiarioClient";

type Props = {
  meal: string;
  label: string;
  entries: DiaryEntry[];
  onAdd: () => void;
  onDelete: (id: string) => void;
  onEdit: (entry: DiaryEntry) => void;
};

export function MealSection({ label, entries, onAdd, onDelete, onEdit }: Props) {
  const mealKcal = entries.reduce((s, e) => s + e.kcal, 0);
  const mealProtein = entries.reduce((s, e) => s + e.protein, 0);
  const mealCarbs = entries.reduce((s, e) => s + e.carbs, 0);
  const mealFat = entries.reduce((s, e) => s + e.fat, 0);

  return (
    <div className="rounded-xl bg-[#18181B] border border-[#27272A] overflow-hidden">
      {/* Meal header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#27272A]">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-white text-sm">{label}</span>
          {entries.length > 0 && (
            <span className="text-xs text-[#A1A1AA]">· {Math.round(mealKcal)} kcal</span>
          )}
        </div>
        <button
          onClick={onAdd}
          className="flex items-center gap-1 text-xs text-[#3DD6E0] hover:text-white font-medium transition-colors px-2 py-1 rounded-lg hover:bg-[#27272A]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Añadir
        </button>
      </div>

      {/* Food entries */}
      {entries.length === 0 ? (
        <div className="px-4 py-3 text-xs text-[#52525B] italic">Sin alimentos registrados</div>
      ) : (
        <div className="divide-y divide-[#27272A]">
          {entries.map((entry) => (
            <FoodRow key={entry.id} entry={entry} onDelete={onDelete} onEdit={onEdit} />
          ))}
        </div>
      )}

      {/* Meal macro summary */}
      {entries.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-2 bg-[#09090B]/40 border-t border-[#27272A]">
          <MacroMini label="P" value={mealProtein} color="#D4175A" />
          <MacroMini label="HC" value={mealCarbs} color="#3DD6E0" />
          <MacroMini label="G" value={mealFat} color="#F59E0B" />
        </div>
      )}
    </div>
  );
}

function FoodRow({
  entry,
  onDelete,
  onEdit,
}: {
  entry: DiaryEntry;
  onDelete: (id: string) => void;
  onEdit: (entry: DiaryEntry) => void;
}) {
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
          title="Editar gramos"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button
          onClick={() => onDelete(entry.id)}
          className="p-1.5 rounded-lg text-[#A1A1AA] hover:text-red-400 hover:bg-[#27272A] transition-colors"
          title="Eliminar"
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
