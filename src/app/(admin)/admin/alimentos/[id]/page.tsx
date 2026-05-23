"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PageSpinner } from "@/components/shared/LoadingSpinner";
import type { Food } from "@/types";

type FoodForm = {
  name: string;
  brand: string;
  category: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  fiber: string;
};

const EMPTY_FORM: FoodForm = {
  name: "", brand: "", category: "", calories: "", protein: "", carbs: "", fat: "", fiber: "",
};

function foodToForm(food: Food): FoodForm {
  return {
    name: food.name,
    brand: food.brand ?? "",
    category: food.category ?? "",
    calories: String(food.calories),
    protein: String(food.protein),
    carbs: String(food.carbs),
    fat: String(food.fat),
    fiber: food.fiber ? String(food.fiber) : "",
  };
}

export default function EditarAlimentoPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const isNew = params.id === "nuevo";

  const [form, setForm] = useState<FoodForm>(EMPTY_FORM);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isNew) return;
    async function load() {
      const res = await fetch(`/api/alimentos/${params.id}`);
      if (res.ok) {
        const food = await res.json() as Food;
        setForm(foodToForm(food));
      }
      setLoading(false);
    }
    void load();
  }, [params.id, isNew]);

  function update(field: keyof FoodForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const body = {
      name: form.name,
      brand: form.brand || null,
      category: form.category || null,
      calories: Number(form.calories),
      protein: Number(form.protein),
      carbs: Number(form.carbs),
      fat: Number(form.fat),
      fiber: form.fiber ? Number(form.fiber) : null,
    };

    const res = await fetch(
      isNew ? "/api/admin/alimentos" : `/api/alimentos/${params.id}`,
      {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );

    setSaving(false);
    if (!res.ok) {
      const data = await res.json() as { error: string };
      setError(typeof data.error === "string" ? data.error : "Error guardando");
      return;
    }

    setSuccess(true);
    setTimeout(() => router.push("/admin/alimentos"), 1000);
  }

  if (loading) return <PageSpinner />;

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[#FAFAFA]">
          {isNew ? "Nuevo alimento" : "Editar alimento"}
        </h1>
        <p className="text-sm text-[#A1A1AA] mt-1">
          Los macros dominantes se calculan automáticamente
        </p>
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-4">
        <Input
          label="Nombre *"
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          required
          placeholder="Arroz blanco cocido"
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Marca"
            value={form.brand}
            onChange={(e) => update("brand", e.target.value)}
            placeholder="Mercadona"
          />
          <Input
            label="Categoría"
            value={form.category}
            onChange={(e) => update("category", e.target.value)}
            placeholder="cereales"
          />
        </div>

        <div className="bg-[#18181B] border border-[#27272A] rounded-[12px] p-4">
          <p className="text-sm font-medium text-[#FAFAFA] mb-3">Valores por 100g</p>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Calorías (kcal) *"
              type="number"
              min={0}
              step={0.1}
              value={form.calories}
              onChange={(e) => update("calories", e.target.value)}
              required
            />
            <Input
              label="Proteína (g) *"
              type="number"
              min={0}
              step={0.1}
              value={form.protein}
              onChange={(e) => update("protein", e.target.value)}
              required
            />
            <Input
              label="Hidratos (g) *"
              type="number"
              min={0}
              step={0.1}
              value={form.carbs}
              onChange={(e) => update("carbs", e.target.value)}
              required
            />
            <Input
              label="Grasa (g) *"
              type="number"
              min={0}
              step={0.1}
              value={form.fat}
              onChange={(e) => update("fat", e.target.value)}
              required
            />
            <Input
              label="Fibra (g)"
              type="number"
              min={0}
              step={0.1}
              value={form.fiber}
              onChange={(e) => update("fiber", e.target.value)}
            />
          </div>
        </div>

        {error && <p className="text-sm text-[#EF4444]">{error}</p>}
        {success && <p className="text-sm text-[#22C55E]">Guardado correctamente. Redirigiendo...</p>}

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button type="submit" loading={saving} className="flex-1">
            {isNew ? "Crear alimento" : "Guardar cambios"}
          </Button>
        </div>
      </form>
    </div>
  );
}
