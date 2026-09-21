"use client";

import { useState, useEffect, useRef } from "react";

type Food = {
  id: string;
  name: string;
  brand: string | null;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type FoodResult = {
  id: string;
  name: string;
  brand: string | null;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

type Props = {
  meal: string;
  onConfirm: (food: FoodResult, grams: number) => void;
  onClose: () => void;
};

export function AddFoodModal({ meal, onConfirm, onClose }: Props) {
  const [step, setStep] = useState<"search" | "grams">("search");
  const [query, setQuery] = useState("");
  const [foods, setFoods] = useState<FoodResult[]>([]);
  const [searching, setSearching] = useState(false);
  const searchCache = useRef<Map<string, FoodResult[]>>(new Map());
  const [selected, setSelected] = useState<FoodResult | null>(null);
  const [grams, setGrams] = useState("100");
  const searchRef = useRef<HTMLInputElement>(null);
  const gramsRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (step === "search") searchRef.current?.focus();
    if (step === "grams") {
      gramsRef.current?.focus();
      gramsRef.current?.select();
    }
  }, [step]);

  useEffect(() => {
    if (query.length < 2) { setFoods([]); return; }
    // Return cached result instantly if available
    const cached = searchCache.current.get(query);
    if (cached) { setFoods(cached); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/alimentos?q=${encodeURIComponent(query)}&limit=15`);
        if (res.ok) {
          const data = await res.json() as { foods: FoodResult[] };
          searchCache.current.set(query, data.foods ?? []);
          setFoods(data.foods ?? []);
        }
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const gramsNum = parseFloat(grams);
  const ratio = isNaN(gramsNum) || gramsNum <= 0 ? 0 : gramsNum / 100;

  const handleSelect = (food: FoodResult) => {
    setSelected(food);
    setStep("grams");
  };

  const handleConfirm = () => {
    if (!selected || !gramsNum || gramsNum <= 0) return;
    onConfirm(selected, gramsNum);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-full max-w-sm mx-auto bg-[#18181B] rounded-t-2xl sm:rounded-2xl border border-[#27272A] max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-[#27272A]">
          <div className="flex items-center gap-2">
            {step === "grams" && (
              <button onClick={() => setStep("search")} className="text-[#A1A1AA] hover:text-white mr-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <div>
              <h2 className="text-white font-semibold text-sm">{step === "search" ? "Añadir alimento" : "Cantidad"}</h2>
              <p className="text-xs text-[#A1A1AA]">{meal}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#A1A1AA] hover:text-white p-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {step === "search" ? (
          <>
            <div className="px-4 py-3 border-b border-[#27272A]">
              <div className="relative">
                <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#52525B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  ref={searchRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar alimento..."
                  className="w-full bg-[#09090B] border border-[#27272A] rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-[#52525B] focus:outline-none focus:border-[#3DD6E0]"
                />
              </div>
            </div>

            <div className="overflow-y-auto flex-1">
              {searching && (
                <div className="text-center text-[#A1A1AA] text-sm py-6">Buscando...</div>
              )}
              {!searching && query.length >= 2 && foods.length === 0 && (
                <div className="text-center text-[#A1A1AA] text-sm py-6">Sin resultados para "{query}"</div>
              )}
              {!searching && query.length < 2 && (
                <div className="text-center text-[#52525B] text-sm py-8">Escribe al menos 2 letras para buscar</div>
              )}
              {foods.map((food) => (
                <button
                  key={food.id}
                  onClick={() => handleSelect(food)}
                  className="w-full text-left px-4 py-3 border-b border-[#27272A] hover:bg-[#27272A] transition-colors"
                >
                  <p className="text-sm text-white font-medium">{food.name}</p>
                  <p className="text-xs text-[#A1A1AA] mt-0.5">
                    {food.brand ? `${food.brand} · ` : ""}{Math.round(food.calories)} kcal/100g
                  </p>
                  <div className="flex gap-2 mt-1">
                    <span className="text-[10px] text-[#D4175A]">{food.protein.toFixed(1)}g P</span>
                    <span className="text-[10px] text-[#3DD6E0]">{food.carbs.toFixed(1)}g HC</span>
                    <span className="text-[10px] text-[#F59E0B]">{food.fat.toFixed(1)}g G</span>
                  </div>
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="px-4 py-4 flex flex-col gap-4">
            {selected && (
              <div className="bg-[#09090B] rounded-xl p-3 border border-[#27272A]">
                <p className="text-white font-medium text-sm">{selected.name}</p>
                {selected.brand && <p className="text-xs text-[#A1A1AA] mt-0.5">{selected.brand}</p>}
              </div>
            )}

            <div>
              <label className="text-xs text-[#A1A1AA] font-medium mb-2 block">Cantidad (gramos)</label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setGrams((g) => String(Math.max(5, (parseFloat(g) || 100) - 10)))}
                  className="w-10 h-10 rounded-lg bg-[#27272A] text-white text-lg font-bold hover:bg-[#3DD6E0] hover:text-black transition-colors flex items-center justify-center"
                >−</button>
                <input
                  ref={gramsRef}
                  type="number"
                  value={grams}
                  onChange={(e) => setGrams(e.target.value)}
                  min={1}
                  max={5000}
                  className="flex-1 bg-[#09090B] border border-[#27272A] rounded-lg px-4 py-2.5 text-white text-center text-lg font-bold focus:outline-none focus:border-[#3DD6E0]"
                />
                <button
                  onClick={() => setGrams((g) => String((parseFloat(g) || 100) + 10))}
                  className="w-10 h-10 rounded-lg bg-[#27272A] text-white text-lg font-bold hover:bg-[#3DD6E0] hover:text-black transition-colors flex items-center justify-center"
                >+</button>
              </div>
            </div>

            {selected && ratio > 0 && (
              <div className="grid grid-cols-4 gap-2">
                <MiniMacro label="kcal" value={Math.round(selected.calories * ratio)} color="#3DD6E0" />
                <MiniMacro label="P" value={parseFloat((selected.protein * ratio).toFixed(1))} color="#D4175A" />
                <MiniMacro label="HC" value={parseFloat((selected.carbs * ratio).toFixed(1))} color="#3DD6E0" />
                <MiniMacro label="G" value={parseFloat((selected.fat * ratio).toFixed(1))} color="#F59E0B" />
              </div>
            )}

            <button
              onClick={handleConfirm}
              disabled={!gramsNum || gramsNum <= 0}
              className="w-full py-3 rounded-xl font-bold text-sm text-black disabled:opacity-40 transition-opacity"
              style={{ background: "linear-gradient(90deg, #3DD6E0, #D4175A)" }}
            >
              Añadir al diario
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function MiniMacro({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-[#09090B] rounded-lg p-2 text-center border border-[#27272A]">
      <p className="font-bold text-sm" style={{ color }}>{value}</p>
      <p className="text-[10px] text-[#A1A1AA]">{label}</p>
    </div>
  );
}
