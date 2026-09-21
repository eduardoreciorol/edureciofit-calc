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

type DailyTargets = { kcal: number | null; protein: number | null; carbs: number | null; fat: number | null };

type DiaryData = {
  meals: UserMeal[];
  totals: { kcal: number; protein: number; carbs: number; fat: number };
  dailyTargets: DailyTargets | null;
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
  const [showDailyTargetsModal, setShowDailyTargetsModal] = useState(false);

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
          <div className="flex items-center gap-2">
            <span className="text-[#3DD6E0] font-bold text-lg">
              {Math.round(totals.kcal)}{data?.dailyTargets?.kcal ? ` / ${data.dailyTargets.kcal}` : ""} kcal
            </span>
            <button
              onClick={() => setShowDailyTargetsModal(true)}
              className="p-1 rounded-lg text-[#A1A1AA] hover:text-[#3DD6E0] hover:bg-[#27272A] transition-colors"
              title="Fijar objetivos diarios"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <MacroChip label="Proteína" value={totals.protein} target={data?.dailyTargets?.protein ?? null} color="#D4175A" />
          <MacroChip label="Hidratos" value={totals.carbs} target={data?.dailyTargets?.carbs ?? null} color="#3DD6E0" />
          <MacroChip label="Grasa" value={totals.fat} target={data?.dailyTargets?.fat ?? null} color="#F59E0B" />
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

      {showDailyTargetsModal && (
        <DailyTargetsModal
          current={data?.dailyTargets ?? null}
          onSave={async (targets) => {
            await fetch("/api/me", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(targets),
            });
            setShowDailyTargetsModal(false);
            load(date);
          }}
          onClose={() => setShowDailyTargetsModal(false)}
        />
      )}
    </div>
  );
}

function MacroChip({ label, value, target, color }: { label: string; value: number; target: number | null; color: string }) {
  const remaining = target !== null ? target - value : null;
  const pct = target !== null && target > 0 ? Math.min(value / target, 1) : null;
  const over = remaining !== null && remaining < 0;

  return (
    <div className="flex flex-col bg-[#09090B] rounded-lg py-2 px-2 gap-1">
      <div className="flex items-baseline justify-between">
        <span className="font-bold text-sm" style={{ color }}>{value.toFixed(1)}g</span>
        {target !== null && (
          <span className="text-[10px] text-[#52525B]">/{target}g</span>
        )}
      </div>
      {pct !== null && (
        <div className="h-1 rounded-full bg-[#27272A] overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${pct * 100}%`, background: over ? "#EF4444" : color }}
          />
        </div>
      )}
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-[#A1A1AA]">{label}</span>
        {remaining !== null && (
          <span className={`text-[10px] font-medium ${over ? "text-red-400" : "text-[#22C55E]"}`}>
            {over ? `+${Math.abs(remaining).toFixed(1)}` : `-${remaining.toFixed(1)}`}g
          </span>
        )}
      </div>
    </div>
  );
}

function DailyTargetsModal({
  current,
  onSave,
  onClose,
}: {
  current: { kcal: number | null; protein: number | null; carbs: number | null; fat: number | null } | null;
  onSave: (t: { dailyKcal: number | null; dailyProtein: number | null; dailyCarbs: number | null; dailyFat: number | null }) => Promise<void>;
  onClose: () => void;
}) {
  const [protein, setProtein] = useState<number | null>(current?.protein ?? null);
  const [carbs, setCarbs] = useState<number | null>(current?.carbs ?? null);
  const [fat, setFat] = useState<number | null>(current?.fat ?? null);
  const [saving, setSaving] = useState(false);

  const autoKcal = (protein !== null || carbs !== null || fat !== null)
    ? Math.round(((protein ?? 0) * 4) + ((carbs ?? 0) * 4) + ((fat ?? 0) * 9))
    : null;

  const numInput = (
    label: string,
    value: number | null,
    onChange: (v: number | null) => void,
    color: string
  ) => (
    <div className="flex items-center gap-3">
      <label className="text-sm font-medium flex-1" style={{ color }}>{label}</label>
      <input
        type="number"
        min={0}
        step={0.1}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value === "" ? null : parseFloat(e.target.value))}
        placeholder="—"
        className="w-24 bg-[#09090B] border border-[#27272A] rounded-lg px-3 py-1.5 text-white text-right text-sm focus:outline-none focus:border-[#3DD6E0]"
      />
      <span className="text-xs text-[#A1A1AA] w-4">g</span>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-full max-w-sm mx-auto bg-[#18181B] rounded-t-2xl border border-[#27272A]">
        <div className="flex items-center justify-between px-4 py-4 border-b border-[#27272A]">
          <h2 className="text-white font-semibold text-sm">Objetivos diarios</h2>
          <button onClick={onClose} className="text-[#A1A1AA] hover:text-white p-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-4 py-5 flex flex-col gap-4">
          <p className="text-xs text-[#A1A1AA]">
            Introduce tus macros objetivo. Las calorías se calculan solas.
          </p>
          {numInput("Proteína", protein, setProtein, "#D4175A")}
          {numInput("Hidratos", carbs, setCarbs, "#3DD6E0")}
          {numInput("Grasa", fat, setFat, "#F59E0B")}

          {/* Auto-calculated kcal */}
          <div className="flex items-center gap-3 border-t border-[#27272A] pt-3">
            <span className="text-sm font-medium flex-1 text-[#A1A1AA]">Calorías totales</span>
            <span className="w-24 text-right font-bold text-lg text-[#3DD6E0]">
              {autoKcal !== null ? autoKcal : "—"}
            </span>
            <span className="text-xs text-[#A1A1AA] w-4">kcal</span>
          </div>

          <button
            onClick={async () => {
              setSaving(true);
              await onSave({ dailyKcal: autoKcal, dailyProtein: protein, dailyCarbs: carbs, dailyFat: fat });
              setSaving(false);
            }}
            disabled={saving}
            className="w-full py-3 rounded-xl font-bold text-sm text-black disabled:opacity-40 mt-1"
            style={{ background: "linear-gradient(90deg, #3DD6E0, #D4175A)" }}
          >
            {saving ? "Guardando..." : "Guardar objetivos"}
          </button>
        </div>
      </div>
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
