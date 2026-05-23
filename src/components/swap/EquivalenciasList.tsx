"use client";

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

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error("Error cargando equivalencias");
    return r.json() as Promise<ApiResponse>;
  });

export function EquivalenciasList({ foodId, quantity }: EquivalenciasListProps) {
  const { data, error, isLoading } = useSWR<ApiResponse>(
    foodId && quantity > 0
      ? `/api/equivalencias?food_id=${foodId}&qty=${quantity}`
      : null,
    fetcher
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

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-[#A1A1AA] px-1">
        {data.equivalencias.length} equivalencias encontradas
      </p>
      {data.equivalencias.map((eq, i) => (
        <EquivalenciaCard key={`${eq.food.id}-${i}`} result={eq} />
      ))}
    </div>
  );
}
