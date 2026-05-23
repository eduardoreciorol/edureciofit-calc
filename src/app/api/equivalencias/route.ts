import { NextResponse } from "next/server";
import { getEquivalencias } from "@/lib/equivalencias/algorithm";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const foodId = searchParams.get("food_id");
  const qty = Number(searchParams.get("qty") ?? "0");

  if (!foodId) return NextResponse.json({ error: "food_id requerido" }, { status: 400 });
  if (!qty || qty <= 0 || qty > 5000) {
    return NextResponse.json({ error: "Cantidad inválida (1-5000g)" }, { status: 400 });
  }

  const food = await prisma.food.findUnique({ where: { id: foodId } });
  if (!food) return NextResponse.json({ error: "Alimento no encontrado" }, { status: 404 });

  const factor = qty / 100;
  const sourceMacros = {
    protein: food.protein.toNumber() * factor,
    carbs: food.carbs.toNumber() * factor,
    fat: food.fat.toNumber() * factor,
    calories: food.calories.toNumber() * factor,
  };

  const equivalencias = await getEquivalencias(foodId, qty);

  return NextResponse.json({
    source_food: {
      id: food.id,
      name: food.name,
      brand: food.brand,
      quantity: qty,
      macros: sourceMacros,
    },
    dominant_macro: food.dominantMacro,
    equivalencias,
  });
}
