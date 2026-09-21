"use client";

import { useState } from "react";
import useSWR from "swr";
import { EquivalenciaCard } from "./EquivalenciaCard";
import { SkeletonCard } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState";
import type { EquivalenciaResult } from "@/types";

interface EquivalenciasListProps {
  foodId: string;
  quantity: number;
}

interface ApiResponse {
  equivalencias: EquivalenciaResult[];
}

const PAGE_SIZE = 5;

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error("Error cargando equivalencias");
    return r.json() as Promise<ApiResponse>;
  });

export function EquivalenciasList({ foodId, quantity }: EquivalenciasListProps) {
  const [visible, setVisible] = useState(PAGE_SIZE);

  const { data, error, isLoading } = useSWR<ApiResponse>(
    foodId && quantity > 0
      ? `/api/equivalencias?food_id=${foodId}&qty=${quantity}`
      : null,
    fetcher,
    { onSuccess: () => setVisible(PAGE_SIZE) }
  );

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        title="Error cargando equivalencias"
        description="Inténtalo de nuevo"
        icon="⚠️"
      />
    );
  }

  if (!data || data.equivalencias.length === 0) {
    return (
      <EmptyState
        title="Sin equivalencias"
        description="No encontramos alimentos equivalentes en la base de datos"
        icon="🔍"
      />
    );
  }

  const total = data.equivalencias.length;
  const shown = data.equivalencias.slice(0, visible);
  const hasMore = visible < total;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-[#A1A1AA] px-1">
        Mostrando {shown.length} de {total} equivalencias
      </p>

      {shown.map((eq, i) => (
        <EquivalenciaCard key={`${eq.food.id}-${i}`} result={eq} />
      ))}

      {hasMore && (
        <button
          onClick={() => setVisible((v) => v + PAGE_SIZE)}
          className="w-full py-3 rounded-xl text-sm font-semibold border border-[#27272A] text-[#3DD6E0] hover:bg-[#27272A] transition-colors mt-1"
        >
          Cargar más opciones ({total - visible} restantes)
        </button>
      )}

      {!hasMore && total > PAGE_SIZE && (
        <p className="text-center text-xs text-[#52525B] py-2">
          Has visto todas las equivalencias disponibles
        </p>
      )}
    </div>
  );
}
