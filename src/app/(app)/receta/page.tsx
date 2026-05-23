"use client";

import { useState, useCallback } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { RecetaBuilder, type RecetaItem } from "@/components/receta/RecetaBuilder";
import { RecetaMacrosSummary } from "@/components/receta/RecetaMacrosSummary";
import { AlternativasList } from "@/components/receta/AlternativasList";
import { Button } from "@/components/ui/button";
import { PageSpinner } from "@/components/shared/LoadingSpinner";
import type { Food, Macros, RecipeAlternativa } from "@/types";

const EMPTY_MACROS: Macros = { protein: 0, carbs: 0, fat: 0, calories: 0 };

function calcTotals(items: RecetaItem[]): Macros {
  return items.reduce(
    (acc, item) => {
      const f = item.quantity / 100;
      return {
        protein: acc.protein + item.food.protein * f,
        carbs: acc.carbs + item.food.carbs * f,
        fat: acc.fat + item.food.fat * f,
        calories: acc.calories + item.food.calories * f,
      };
    },
    { ...EMPTY_MACROS }
  );
}

export default function RecetaPage() {
  const [items, setItems] = useState<RecetaItem[]>([]);
  const [alternativas, setAlternativas] = useState<RecipeAlternativa[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAdd = useCallback((food: Food) => {
    setAlternativas(null);
    setItems((prev) => [
      ...prev,
      { food, quantity: 100, tempId: `${Date.now()}-${Math.random()}` },
    ]);
  }, []);

  const handleRemove = useCallback((tempId: string) => {
    setAlternativas(null);
    setItems((prev) => prev.filter((i) => i.tempId !== tempId));
  }, []);

  const handleUpdateQuantity = useCallback((tempId: string, qty: number) => {
    setAlternativas(null);
    setItems((prev) =>
      prev.map((i) => (i.tempId === tempId ? { ...i, quantity: Math.max(1, qty) } : i))
    );
  }, []);

  async function handleGetAlternativas() {
    if (items.length < 1) return;
    setLoading(true);
    setError(null);

    const res = await fetch("/api/receta", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        foods: items.map((i) => ({ food_id: i.food.id, quantity: i.quantity })),
      }),
    });

    setLoading(false);
    if (!res.ok) {
      setError("Error buscando alternativas");
      return;
    }
    const data = await res.json() as { alternativas: RecipeAlternativa[] };
    setAlternativas(data.alternativas);
  }

  const totals = calcTotals(items);
  const canSearch = items.length >= 1;

  return (
    <div className="flex flex-col">
      <PageHeader title="Mi Receta" />

      <div className="px-4 py-5 flex flex-col gap-5">
        {/* Builder */}
        <RecetaBuilder
          items={items}
          onAdd={handleAdd}
          onRemove={handleRemove}
          onUpdateQuantity={handleUpdateQuantity}
        />

        {/* Totals */}
        {items.length > 0 && (
          <RecetaMacrosSummary macros={totals} label="Macros totales" />
        )}

        {/* CTA */}
        {canSearch && (
          <Button
            size="lg"
            onClick={handleGetAlternativas}
            loading={loading}
            className="w-full"
          >
            Ver alternativas con los mismos macros
          </Button>
        )}

        {error && <p className="text-sm text-[#EF4444] text-center">{error}</p>}

        {/* Loader */}
        {loading && <PageSpinner />}

        {/* Alternativas */}
        {!loading && alternativas && (
          <AlternativasList alternativas={alternativas} />
        )}

        {/* Empty */}
        {items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-5xl mb-4">🍽️</p>
            <p className="text-[#FAFAFA] font-semibold">Construye tu receta</p>
            <p className="text-sm text-[#A1A1AA] mt-1 max-w-[260px]">
              Añade los alimentos de tu menú y busca alternativas con los mismos macros
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
