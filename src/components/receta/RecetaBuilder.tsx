"use client";

import { FoodSearch } from "@/components/swap/FoodSearch";
import { Button } from "@/components/ui/button";
import type { Food } from "@/types";

export interface RecetaItem {
  food: Food;
  quantity: number;
  tempId: string;
}

interface RecetaBuilderProps {
  items: RecetaItem[];
  onAdd: (food: Food) => void;
  onRemove: (tempId: string) => void;
  onUpdateQuantity: (tempId: string, qty: number) => void;
}

export function RecetaBuilder({
  items,
  onAdd,
  onRemove,
  onUpdateQuantity,
}: RecetaBuilderProps) {
  return (
    <div className="flex flex-col gap-4">
      <FoodSearch onSelect={onAdd} placeholder="Añadir alimento a la receta..." clearOnSelect />

      {items.length > 0 && (
        <div className="flex flex-col gap-2">
          {items.map((item) => (
            <div
              key={item.tempId}
              className="flex items-center gap-3 bg-[#18181B] border border-[#27272A] rounded-[10px] p-3"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#FAFAFA] truncate">{item.food.name}</p>
                {item.food.brand && (
                  <p className="text-xs text-[#A1A1AA]">{item.food.brand}</p>
                )}
              </div>

              {/* Quantity input */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <input
                  type="number"
                  min={1}
                  max={2000}
                  value={item.quantity}
                  onChange={(e) =>
                    onUpdateQuantity(item.tempId, Number(e.target.value))
                  }
                  className="w-16 h-8 bg-[#27272A] border border-[#3F3F46] rounded-[6px] text-center text-sm text-[#FAFAFA] focus:outline-none focus:border-[#3B82F6]"
                />
                <span className="text-xs text-[#A1A1AA]">g</span>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemove(item.tempId)}
                className="flex-shrink-0 h-8 w-8 p-0 text-[#A1A1AA] hover:text-[#EF4444]"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
