"use client";

import { useState, useEffect } from "react";
import { UserMeal } from "./DiarioClient";

type Macro = "protein" | "carbs" | "fat";

type Suggestion = {
  id: string;
  name: string;
  brand: string | null;
  grams: number;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
};

type Remaining = {
  protein: number | null;
  carbs: number | null;
  fat: number | null;
};

type Props = {
  meal: UserMeal;
  date: string;
  onAdd: (foodId: string, grams: number) => void;
  onClose: () => void;
};

const MACRO_LABELS: Record<Macro, string> = {
  protein: "Proteína",
  carbs: "Hidratos",
  fat: "Grasa",
};
const MACRO_COLORS: Record<Macro, string> = {
  protein: "#D4175A",
  carbs: "#3DD6E0",
  fat: "#F59E0B",
};

export function SugerenciasModal({ meal, date, onAdd, onClose }: Props) {
  const [step, setStep] = useState<"macro" | "results">("macro");
  const [selectedMacro, setSelectedMacro] = useState<Macro | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [remaining, setRemaining] = useState<Remaining | null>(null);
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState<Set<string>>(new Set());

  // Calculate which macros are already complete
  const mealProtein = meal.entries.reduce((s, e) => s + e.protein, 0);
  const mealCarbs = meal.entries.reduce((s, e) => s + e.carbs, 0);
  const mealFat = meal.entries.reduce((s, e) => s + e.fat, 0);

  const availableMacros: Macro[] = (["protein", "carbs", "fat"] as Macro[]).filter((m) => {
    const target = m === "protein" ? meal.targetProtein : m === "carbs" ? meal.targetCarbs : meal.targetFat;
    const logged = m === "protein" ? mealProtein : m === "carbs" ? mealCarbs : mealFat;
    return target !== null && target - logged > 0.5;
  });

  const fetchSuggestions = async (macro: Macro) => {
    setLoading(true);
    setSelectedMacro(macro);
    try {
      const res = await fetch(
        `/api/diario/sugerencias?userMealId=${meal.id}&date=${date}&macro=${macro}`
      );
      const data = await res.json();
      setSuggestions(data.suggestions ?? []);
      setRemaining(data.remaining ?? null);
      setStep("results");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (s: Suggestion) => {
    onAdd(s.id, s.grams);
    setAdded((prev) => new Set(prev).add(s.id));
  };

  const remainingForSelected = selectedMacro && remaining ? remaining[selectedMacro] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-full max-w-sm mx-auto bg-[#18181B] rounded-t-2xl sm:rounded-2xl border border-[#27272A] max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-[#27272A]">
          <span className="text-yellow-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2a7 7 0 00-3.5 13.07V17a1 1 0 001 1h5a1 1 0 001-1v-1.93A7 7 0 0012 2zm-1 14v-1h2v1h-2zm2.5-2.5h-3A5 5 0 017 8.5a5 5 0 0110 0 5 5 0 01-3.5 5z" />
            </svg>
          </span>
          <div className="flex-1">
            <h2 className="text-white font-semibold text-sm">Sugerencias para {meal.name}</h2>
            <p className="text-xs text-[#A1A1AA] mt-0.5">
              {step === "macro" ? "¿Qué macro quieres completar?" : selectedMacro ? `Completar ${MACRO_LABELS[selectedMacro].toLowerCase()}` : ""}
            </p>
          </div>
          <button onClick={onClose} className="text-[#A1A1AA] hover:text-white p-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-4">
          {step === "macro" ? (
            <div className="flex flex-col gap-3">
              {availableMacros.length === 0 ? (
                <p className="text-center text-[#A1A1AA] text-sm py-4">Todos los macros están completos ✓</p>
              ) : (
                availableMacros.map((macro) => {
                  const target = macro === "protein" ? meal.targetProtein : macro === "carbs" ? meal.targetCarbs : meal.targetFat;
                  const logged = macro === "protein" ? mealProtein : macro === "carbs" ? mealCarbs : mealFat;
                  const rem = target !== null ? target - logged : 0;
                  return (
                    <button
                      key={macro}
                      onClick={() => fetchSuggestions(macro)}
                      disabled={loading}
                      className="flex items-center gap-3 bg-[#09090B] border border-[#27272A] rounded-xl px-4 py-3 hover:border-current transition-colors text-left disabled:opacity-50"
                      style={{ borderColor: undefined }}
                    >
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: MACRO_COLORS[macro] }} />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-white">{MACRO_LABELS[macro]}</p>
                        <p className="text-xs text-[#A1A1AA] mt-0.5">
                          Faltan <span style={{ color: MACRO_COLORS[macro] }}>{rem.toFixed(1)}g</span>
                          {target !== null ? ` de ${target}g objetivo` : ""}
                        </p>
                      </div>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#A1A1AA]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  );
                })
              )}
            </div>
          ) : loading ? (
            <div className="text-center text-[#A1A1AA] text-sm py-6">Buscando sugerencias...</div>
          ) : (
            <div className="flex flex-col gap-3">
              {remainingForSelected !== null && selectedMacro && (
                <p className="text-xs text-[#A1A1AA] mb-1">
                  Faltan <span style={{ color: MACRO_COLORS[selectedMacro] }} className="font-bold">{remainingForSelected.toFixed(1)}g de {MACRO_LABELS[selectedMacro].toLowerCase()}</span>.
                  Estas cantidades te ayudarían a completarlo:
                </p>
              )}
              {suggestions.length === 0 ? (
                <p className="text-center text-[#A1A1AA] text-sm py-4">Sin sugerencias disponibles</p>
              ) : (
                suggestions.map((s) => {
                  const isAdded = added.has(s.id);
                  return (
                    <div key={s.id} className={`bg-[#09090B] border rounded-xl px-3 py-3 ${isAdded ? "border-green-600/50 opacity-60" : "border-[#27272A]"}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white font-medium truncate">{s.name}</p>
                          {s.brand && <p className="text-xs text-[#A1A1AA]">{s.brand}</p>}
                          <p className="text-xs text-[#A1A1AA] mt-1">
                            <span className="text-white font-semibold">{s.grams}g</span> · {Math.round(s.kcal)} kcal
                          </p>
                          <div className="flex gap-2 mt-1">
                            <span className="text-[10px] text-[#D4175A]">{s.protein.toFixed(1)}g P</span>
                            <span className="text-[10px] text-[#3DD6E0]">{s.carbs.toFixed(1)}g HC</span>
                            <span className="text-[10px] text-[#F59E0B]">{s.fat.toFixed(1)}g G</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleAdd(s)}
                          disabled={isAdded}
                          className="flex-shrink-0 px-3 py-1.5 rounded-lg font-bold text-xs text-black disabled:opacity-50 transition-opacity"
                          style={{ background: isAdded ? "#22C55E" : "linear-gradient(90deg, #3DD6E0, #D4175A)" }}
                        >
                          {isAdded ? "✓" : "Añadir"}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}

              <button
                onClick={() => { setStep("macro"); setAdded(new Set()); }}
                className="text-xs text-[#A1A1AA] hover:text-white mt-1 text-center w-full py-2"
              >
                ← Elegir otro macro
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
