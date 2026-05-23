"use client";

import { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { FoodSearch } from "@/components/swap/FoodSearch";
import { MacroBadge } from "@/components/swap/MacroBadge";
import { EquivalenciasList } from "@/components/swap/EquivalenciasList";
import type { Food } from "@/types";

export default function SwapPage() {
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [quantity, setQuantity] = useState(100);

  return (
    <div className="flex flex-col">
      <PageHeader title="Intercambiar Alimento" />

      <div className="px-4 py-5 flex flex-col gap-5">
        {/* Search */}
        <div>
          <p className="text-xs text-[#A1A1AA] mb-2 font-medium uppercase tracking-wide">
            1. Busca el alimento
          </p>
          <FoodSearch
            onSelect={(food) => {
              setSelectedFood(food);
              setQuantity(100);
            }}
            selectedFoodId={selectedFood?.id}
          />
        </div>

        {/* Quantity + macro info */}
        {selectedFood && (
          <div>
            <p className="text-xs text-[#A1A1AA] mb-2 font-medium uppercase tracking-wide">
              2. ¿Cuántos gramos?
            </p>
            <div className="bg-[#18181B] border border-[#27272A] rounded-[12px] p-4 flex flex-col gap-4">
              {/* Selected food info */}
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-[#FAFAFA] truncate">{selectedFood.name}</p>
                  {selectedFood.brand && (
                    <p className="text-xs text-[#A1A1AA]">{selectedFood.brand}</p>
                  )}
                </div>
                <MacroBadge macro={selectedFood.dominantMacro} className="ml-3 flex-shrink-0" />
              </div>

              {/* Quantity control */}
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min={5}
                  max={500}
                  step={5}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="flex-1 accent-[#3B82F6] h-1.5 rounded-full bg-[#27272A] appearance-none cursor-pointer [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:bg-[#3B82F6] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:cursor-pointer"
                />
                <div className="flex items-baseline gap-1 flex-shrink-0">
                  <span className="text-[2.5rem] font-extrabold text-[#FAFAFA] leading-none">
                    {quantity}
                  </span>
                  <span className="text-sm text-[#A1A1AA]">g</span>
                </div>
              </div>

              {/* Macros preview */}
              <div className="flex gap-4 text-sm border-t border-[#27272A] pt-3">
                <div className="text-center flex-1">
                  <p className="text-[10px] text-[#A1A1AA] uppercase">Prot</p>
                  <p className="font-bold text-[#EC4899]">
                    {((selectedFood.protein * quantity) / 100).toFixed(1)}g
                  </p>
                </div>
                <div className="text-center flex-1">
                  <p className="text-[10px] text-[#A1A1AA] uppercase">Hid</p>
                  <p className="font-bold text-[#3B82F6]">
                    {((selectedFood.carbs * quantity) / 100).toFixed(1)}g
                  </p>
                </div>
                <div className="text-center flex-1">
                  <p className="text-[10px] text-[#A1A1AA] uppercase">Gras</p>
                  <p className="font-bold text-[#F59E0B]">
                    {((selectedFood.fat * quantity) / 100).toFixed(1)}g
                  </p>
                </div>
                <div className="text-center flex-1">
                  <p className="text-[10px] text-[#A1A1AA] uppercase">Kcal</p>
                  <p className="font-bold text-[#FAFAFA]">
                    {((selectedFood.calories * quantity) / 100).toFixed(0)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Equivalencias */}
        {selectedFood && (
          <div>
            <p className="text-xs text-[#A1A1AA] mb-2 font-medium uppercase tracking-wide">
              3. Equivalencias
            </p>
            <EquivalenciasList foodId={selectedFood.id} quantity={quantity} />
          </div>
        )}

        {!selectedFood && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-5xl mb-4">🥗</p>
            <p className="text-[#FAFAFA] font-semibold">Busca un alimento</p>
            <p className="text-sm text-[#A1A1AA] mt-1 max-w-[260px]">
              Escribe el nombre y selecciona el alimento que quieres intercambiar
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
