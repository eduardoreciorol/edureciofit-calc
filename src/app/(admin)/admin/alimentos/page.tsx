"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageSpinner } from "@/components/shared/LoadingSpinner";
import { MacroBadge } from "@/components/swap/MacroBadge";
import type { Food, FoodSource } from "@/types";

const SOURCE_LABEL: Record<FoodSource, string> = {
  openfoodfacts: "OFF",
  custom: "Custom",
  harbiz: "Harbiz",
};

const SOURCE_VARIANT: Record<FoodSource, "muted" | "accent" | "warning"> = {
  openfoodfacts: "muted",
  custom: "accent",
  harbiz: "warning",
};

export default function AlimentosPage() {
  const [foods, setFoods] = useState<Food[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeOnly, setActiveOnly] = useState(true);
  const [source, setSource] = useState<FoodSource | "">("");

  const fetchFoods = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      active: String(activeOnly),
      ...(query.length >= 2 ? { q: query } : {}),
      ...(source ? { source } : {}),
    });
    const res = await fetch(`/api/admin/alimentos?${params}`);
    if (res.ok) {
      const data = await res.json() as { foods: Food[]; total: number };
      setFoods(data.foods);
      setTotal(data.total);
    }
    setLoading(false);
  }, [page, query, activeOnly, source]);

  useEffect(() => { void fetchFoods(); }, [fetchFoods]);

  async function handleToggleActive(id: string, current: boolean) {
    await fetch(`/api/alimentos/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !current }),
    });
    void fetchFoods();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#FAFAFA]">Alimentos</h1>
          <p className="text-sm text-[#A1A1AA] mt-1">{total.toLocaleString("es-ES")} alimentos</p>
        </div>
        <Link href="/admin/alimentos/nuevo">
          <Button>+ Nuevo alimento</Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <Input
          placeholder="Buscar alimento o marca..."
          value={query}
          onChange={(e) => { setQuery(e.target.value); setPage(1); }}
          className="flex-1 min-w-[200px]"
        />
        <button
          onClick={() => { setActiveOnly((v) => !v); setPage(1); }}
          className={`text-sm px-3 py-2 rounded-[8px] border transition-colors ${
            activeOnly
              ? "border-[#3B82F6] text-[#3B82F6] bg-[#3B82F6]/10"
              : "border-[#27272A] text-[#A1A1AA] hover:border-[#3F3F46]"
          }`}
        >
          {activeOnly ? "Solo activos" : "Todos"}
        </button>
        <select
          value={source}
          onChange={(e) => { setSource(e.target.value as FoodSource | ""); setPage(1); }}
          className="text-sm px-3 py-2 rounded-[8px] border border-[#27272A] bg-[#18181B] text-[#A1A1AA] hover:border-[#3F3F46] transition-colors"
        >
          <option value="">Todas las fuentes</option>
          <option value="openfoodfacts">OpenFoodFacts</option>
          <option value="harbiz">Harbiz</option>
          <option value="custom">Custom</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <PageSpinner />
      ) : (
        <div className="bg-[#18181B] border border-[#27272A] rounded-[12px] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#27272A]">
                  <th className="text-left px-4 py-3 text-[#A1A1AA] font-medium">Alimento</th>
                  <th className="text-left px-4 py-3 text-[#A1A1AA] font-medium">Macro</th>
                  <th className="text-left px-4 py-3 text-[#A1A1AA] font-medium">Macros / 100g</th>
                  <th className="text-left px-4 py-3 text-[#A1A1AA] font-medium">Fuente</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {foods.map((food) => (
                  <tr
                    key={food.id}
                    className="border-b border-[#27272A] last:border-0 hover:bg-[#27272A]/30"
                  >
                    <td className="px-4 py-3">
                      <p className={`font-medium ${food.isActive ? "text-[#FAFAFA]" : "text-[#71717A] line-through"}`}>
                        {food.name}
                      </p>
                      {food.brand && (
                        <p className="text-xs text-[#A1A1AA]">{food.brand}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <MacroBadge macro={food.dominantMacro} />
                    </td>
                    <td className="px-4 py-3 text-xs text-[#A1A1AA]">
                      P:{food.protein.toFixed(1)} H:{food.carbs.toFixed(1)} G:{food.fat.toFixed(1)}
                      <br />
                      {food.calories.toFixed(0)} kcal
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={SOURCE_VARIANT[food.source]}>
                        {SOURCE_LABEL[food.source]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right flex items-center gap-2 justify-end">
                      <Link href={`/admin/alimentos/${food.id}`}>
                        <Button variant="ghost" size="sm">Editar</Button>
                      </Link>
                      <Button
                        variant={food.isActive ? "destructive" : "secondary"}
                        size="sm"
                        onClick={() => handleToggleActive(food.id, food.isActive)}
                      >
                        {food.isActive ? "Ocultar" : "Activar"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {total > 20 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-[#27272A]">
              <p className="text-xs text-[#A1A1AA]">
                {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} de {total.toLocaleString("es-ES")}
              </p>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  Anterior
                </Button>
                <Button variant="secondary" size="sm" disabled={page * 20 >= total} onClick={() => setPage((p) => p + 1)}>
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
