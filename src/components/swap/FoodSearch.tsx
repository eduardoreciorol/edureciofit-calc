"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { FoodCard } from "./FoodCard";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import type { Food } from "@/types";

interface FoodSearchProps {
  onSelect: (food: Food) => void;
  selectedFoodId?: string;
  placeholder?: string;
}

function debounce<T extends (...args: Parameters<T>) => void>(fn: T, ms: number): T {
  let timeout: ReturnType<typeof setTimeout>;
  return ((...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), ms);
  }) as T;
}

export function FoodSearch({ onSelect, selectedFoodId, placeholder }: FoodSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Food[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const search = useCallback(
    debounce(async (q: string) => {
      if (q.length < 2) {
        setResults([]);
        setOpen(false);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(`/api/alimentos?q=${encodeURIComponent(q)}&limit=8`);
        if (res.ok) {
          const data = await res.json() as { foods: Food[] };
          setResults(data.foods);
          setOpen(true);
        }
      } finally {
        setLoading(false);
      }
    }, 300),
    []
  );

  useEffect(() => {
    search(query);
  }, [query, search]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <Input
        placeholder={placeholder ?? "Buscar alimento... (ej: arroz, pollo, yogur)"}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        leftIcon={
          loading ? (
            <LoadingSpinner size="sm" />
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          )
        }
        className="h-12 text-base"
      />

      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[#18181B] border border-[#27272A] rounded-[12px] shadow-xl z-50 overflow-hidden">
          <div className="max-h-72 overflow-y-auto p-2 flex flex-col gap-1">
            {results.map((food) => (
              <FoodCard
                key={food.id}
                food={food}
                selected={food.id === selectedFoodId}
                onClick={(f) => {
                  onSelect(f);
                  setQuery(f.name);
                  setOpen(false);
                }}
              />
            ))}
          </div>
        </div>
      )}

      {open && !loading && results.length === 0 && query.length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[#18181B] border border-[#27272A] rounded-[12px] p-4 text-sm text-[#A1A1AA] text-center z-50">
          Sin resultados para &quot;{query}&quot;
        </div>
      )}
    </div>
  );
}
