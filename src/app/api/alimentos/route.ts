import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { DominantMacro } from "@/types";

export async function GET(request: Request) {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const limit = Math.min(Number(searchParams.get("limit") ?? "10"), 50);
  const category = searchParams.get("category");

  if (q.length < 2) {
    return NextResponse.json({ foods: [] });
  }

  const foods = await prisma.food.findMany({
    where: {
      isActive: true,
      ...(category ? { category } : {}),
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { brand: { contains: q, mode: "insensitive" } },
      ],
    },
    orderBy: [{ name: "asc" }],
    take: limit,
    select: {
      id: true,
      name: true,
      brand: true,
      category: true,
      calories: true,
      protein: true,
      carbs: true,
      fat: true,
      fiber: true,
      dominantMacro: true,
      source: true,
      offId: true,
      isActive: true,
      createdById: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const serialized = foods.map((f) => ({
    ...f,
    calories: Number(f.calories),
    protein: Number(f.protein),
    carbs: Number(f.carbs),
    fat: Number(f.fat),
    fiber: f.fiber ? Number(f.fiber) : null,
    dominantMacro: f.dominantMacro as DominantMacro,
  }));

  return NextResponse.json({ foods: serialized });
}
