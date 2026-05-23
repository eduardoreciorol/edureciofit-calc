import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { DominantMacro, Macros } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function roundGrams(grams: number): number {
  if (grams < 10) return Math.round(grams * 10) / 10;
  return Math.round(grams);
}

export function formatMacro(value: number): string {
  return value.toFixed(1);
}

export function calcMacros(food: {
  protein: number;
  carbs: number;
  fat: number;
  calories: number;
}, quantity: number): Macros {
  const factor = quantity / 100;
  return {
    protein: food.protein * factor,
    carbs: food.carbs * factor,
    fat: food.fat * factor,
    calories: food.calories * factor,
  };
}

export function sumMacros(macrosList: Macros[]): Macros {
  return macrosList.reduce(
    (acc, m) => ({
      protein: acc.protein + m.protein,
      carbs: acc.carbs + m.carbs,
      fat: acc.fat + m.fat,
      calories: acc.calories + m.calories,
    }),
    { protein: 0, carbs: 0, fat: 0, calories: 0 }
  );
}

export function macroBorderClass(macro: DominantMacro): string {
  const map: Record<DominantMacro, string> = {
    carbs: "macro-carbs",
    protein: "macro-protein",
    fat: "macro-fat",
    protein_fat: "macro-protein_fat",
    protein_carbs: "macro-protein_carbs",
  };
  return map[macro];
}

export function macroLabel(macro: DominantMacro): string {
  const map: Record<DominantMacro, string> = {
    carbs: "Hidratos",
    protein: "Proteína",
    fat: "Grasa",
    protein_fat: "Proteína + Grasa",
    protein_carbs: "Proteína + Hidratos",
  };
  return map[macro];
}

export function macroBadgeColor(macro: DominantMacro): string {
  const map: Record<DominantMacro, string> = {
    carbs: "bg-primary/20 text-primary",
    protein: "bg-accent/20 text-accent",
    fat: "bg-warning/20 text-warning",
    protein_fat: "bg-warning/20 text-warning",
    protein_carbs: "bg-primary/20 text-primary",
  };
  return map[macro];
}
