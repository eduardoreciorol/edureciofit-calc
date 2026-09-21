"use client";

import { useState, useEffect, useRef } from "react";
import { DiaryEntry } from "./DiarioClient";

type Props = {
  entry: DiaryEntry;
  onSave: (id: string, grams: number) => void;
  onClose: () => void;
};

export function EditGramsModal({ entry, onSave, onClose }: Props) {
  const [grams, setGrams] = useState(String(entry.grams));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const gramsNum = parseFloat(grams);
  const ratio = isNaN(gramsNum) || gramsNum <= 0 ? 0 : gramsNum / 100;
  const perGram = entry.kcal / entry.grams;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-full max-w-sm mx-auto bg-[#18181B] rounded-t-2xl sm:rounded-2xl border border-[#27272A]">
        <div className="flex items-center justify-between px-4 py-4 border-b border-[#27272A]">
          <h2 className="text-white font-semibold text-sm">Editar cantidad</h2>
          <button onClick={onClose} className="text-[#A1A1AA] hover:text-white p-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-4 py-4 flex flex-col gap-4">
          <div className="bg-[#09090B] rounded-xl p-3 border border-[#27272A]">
            <p className="text-white font-medium text-sm">{entry.name}</p>
            {entry.brand && <p className="text-xs text-[#A1A1AA] mt-0.5">{entry.brand}</p>}
          </div>

          <div>
            <label className="text-xs text-[#A1A1AA] font-medium mb-2 block">Cantidad (gramos)</label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setGrams((g) => String(Math.max(5, (parseFloat(g) || entry.grams) - 10)))}
                className="w-10 h-10 rounded-lg bg-[#27272A] text-white text-lg font-bold hover:bg-[#3DD6E0] hover:text-black transition-colors flex items-center justify-center"
              >−</button>
              <input
                ref={inputRef}
                type="number"
                value={grams}
                onChange={(e) => setGrams(e.target.value)}
                min={1}
                max={5000}
                className="flex-1 bg-[#09090B] border border-[#27272A] rounded-lg px-4 py-2.5 text-white text-center text-lg font-bold focus:outline-none focus:border-[#3DD6E0]"
              />
              <button
                onClick={() => setGrams((g) => String((parseFloat(g) || entry.grams) + 10))}
                className="w-10 h-10 rounded-lg bg-[#27272A] text-white text-lg font-bold hover:bg-[#3DD6E0] hover:text-black transition-colors flex items-center justify-center"
              >+</button>
            </div>
          </div>

          {ratio > 0 && (
            <div className="grid grid-cols-4 gap-2">
              <MiniMacro label="kcal" value={Math.round(perGram * gramsNum * 10) / 10} color="#3DD6E0" />
              <MiniMacro label="P" value={parseFloat((entry.protein / entry.grams * gramsNum).toFixed(1))} color="#D4175A" />
              <MiniMacro label="HC" value={parseFloat((entry.carbs / entry.grams * gramsNum).toFixed(1))} color="#3DD6E0" />
              <MiniMacro label="G" value={parseFloat((entry.fat / entry.grams * gramsNum).toFixed(1))} color="#F59E0B" />
            </div>
          )}

          <button
            onClick={() => onSave(entry.id, gramsNum)}
            disabled={!gramsNum || gramsNum <= 0}
            className="w-full py-3 rounded-xl font-bold text-sm text-black disabled:opacity-40 transition-opacity"
            style={{ background: "linear-gradient(90deg, #3DD6E0, #D4175A)" }}
          >
            Guardar
          </button>
        </div>
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
