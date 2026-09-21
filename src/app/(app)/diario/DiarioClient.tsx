"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { MealSection } from "./MealSection";
import { AddFoodModal } from "./AddFoodModal";
import { EditGramsModal } from "./EditGramsModal";
import { MealSettingsSheet } from "./MealSettingsSheet";
import { SugerenciasModal } from "./SugerenciasModal";

export type DiaryEntry = {
  id: string;
  foodId: string;
  name: string;
  brand: string | null;
  grams: number;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type UserMeal = {
  id: string;
  name: string;
  order: number;
  targetKcal: number | null;
  targetProtein: number | null;
  targetCarbs: number | null;
  targetFat: number | null;
  entries: DiaryEntry[];
};

type DiaryData = {
  meals: UserMeal[];
  totals: { kcal: number; protein: number; carbs: number; fat: number };
};

function todayStr() {
  return new Date().toLocaleDateString("sv-SE");
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00");
  const today = todayStr();
  const yesterday = offsetDate(today, -1);
  if (dateStr === today) return "Hoy";
  if (dateStr === yesterday) return "Ayer";
  return d.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
}

function offsetDate(dateStr: string, days: number) {
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString("sv-SE");
}

export function DiarioClient() {
  const [date, setDate] = useState(todayStr);
  const [data, setData] = useState<DiaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [addTarget, setAddTarget] = useState<UserMeal | null>(null);
  const [editTarget, setEditTarget] = useState<{ entry: DiaryEntry; meal: UserMeal } | null>(null);
  const [settingsMeal, setSettingsMeal] = useState<UserMeal | null>(null);
  const [sugerenciasMeal, setSugerenciasMeal] = useState<UserMeal | null>(null);

  const load = useCallback(async (d: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/diario?date=${d}`);
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(date); }, [date, load]);

  const handleDelete = async (id: string) => {
    await fetch(`/api/diario/${id}`, { method: "DELETE" });
    load(date);
  };

  const handleAdd = async (foodId: string, grams: number) => {
    if (!addTarget) return;
    await fetch("/api/diario", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, userMealId: addTarget.id, foodId, grams }),
    });
    setAddTarget(null);
    load(date);
  };

  const handleEditSave = async (id: string, grams: number) => {
    await fetch(`/api/diario/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ grams }),
    });
    setEditTarget(null);
    load(date);
  };

  const handleSugerenciaAdd = async (foodId: string, grams: number) => {
    if (!sugerenciasMeal) return;
    await fetch("/api/diario", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, userMealId: sugerenciasMeal.id, foodId, grams }),
    });
    load(date);
    // Keep modal open to show updated state
  };

  const totals = data?.totals ?? { kcal: 0, protein: 0, carbs: 0, fat: 0 };
  const isToday = date === todayStr();

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader title="Diario" />

      {/* Date navigator */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#18181B] border-b border-[#27272A] sticky top-0 z-10">
        <button
          onClick={() => setDate((d) => offsetDate(d, -1))}
          className="p-2 rounded-lg text-[#A1A1AA] hover:text-white hover:bg-[#27272A] transition-colors"
        >
          <ChevronLeft />
        </button>
        <button
          onClick={() => !isToday && setDate(todayStr())}
          className="flex flex-col items-center"
        >
          <span className="text-white font-semibold capitalize text-sm">{formatDate(date)}</span>
          {!isToday && (
            <span className="text-[10px] text-[#3DD6E0] mt-0.5">Toca para ir a hoy</span>
          )}
        </button>
        <button
          onClick={() => setDate((d) => offsetDate(d, 1))}
          disabled={isToday}
          className="p-2 rounded-lg text-[#A1A1AA] hover:text-white hover:bg-[#27272A] transition-colors disabled:opacity-30"
        >
          <ChevronRight />
        </button>
      </div>

      {/* Daily macro totals */}
      <div className="mx-4 mt-4 rounded-xl bg-[#18181B] border border-[#27272A] p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-[#A1A1AA] uppercase tracking-wider font-medium">Total del día</span>
          <span className="text-[#3DD6E0] font-bold text-lg">{Math.round(totals.kcal)} kcal</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <MacroChip label="Proteína" value={totals.protein} color="#D4175A" />
          <MacroChip label="Hidratos" value={totals.carbs} color="#3DD6E0" />
          <MacroChip label="Grasa" value={totals.fat} color="#F59E0B" />
        </div>
      </div>

      {/* Meals */}
      <div className="flex flex-col gap-3 px-4 py-4">
        {loading ? (
          <div className="text-center text-[#A1A1AA] py-8 text-sm">Cargando...</div>
        ) : (
          data?.meals.map((meal) => (
            <MealSection
              key={meal.id}
              meal={meal}
              date={date}
              onAdd={() => setAddTarget(meal)}
              onDelete={handleDelete}
              onEdit={(entry) => setEditTarget({ entry, meal })}
              onSettings={() => setSettingsMeal(meal)}
              onSugerencias={() => setSugerenciasMeal(meal)}
            />
          ))
        )}
      </div>

      {/* Modals */}
      {addTarget && (
        <AddFoodModal
          meal={addTarget.name}
          onConfirm={handleAdd}
          onClose={() => setAddTarget(null)}
        />
      )}

      {editTarget && (
        <EditGramsModal
          entry={editTarget.entry}
          onSave={handleEditSave}
          onClose={() => setEditTarget(null)}
        />
      )}

      {settingsMeal && (
        <MealSettingsSheet
          meal={settingsMeal}
          allMeals={data?.meals ?? []}
          onClose={() => { setSettingsMeal(null); load(date); }}
        />
      )}

      {sugerenciasMeal && (
        <SugerenciasModal
          meal={sugerenciasMeal}
          date={date}
          onAdd={handleSugerenciaAdd}
          onClose={() => { setSugerenciasMeal(null); load(date); }}
        />
      )}
    </div>
  );
}

function MacroChip({ label, value, color, unit = "g" }: { label: string; value: number; color: string; unit?: string }) {
  return (
    <div className="flex flex-col items-center bg-[#09090B] rounded-lg py-2 px-1">
      <span className="font-bold text-base" style={{ color }}>{value.toFixed(1)}{unit}</span>
      <span className="text-[10px] text-[#A1A1AA] mt-0.5">{label}</span>
    </div>
  );
}

function ChevronLeft() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}
