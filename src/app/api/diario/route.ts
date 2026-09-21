import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const MEAL_ORDER = ["desayuno", "almuerzo", "comida", "merienda", "cena"] as const;

export async function GET(request: Request) {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const dateStr = searchParams.get("date") ?? new Date().toISOString().split("T")[0];

  const date = new Date(dateStr + "T00:00:00.000Z");

  const logs = await prisma.diaryLog.findMany({
    where: { userId: user.id, date },
    include: { food: { select: { name: true, brand: true } } },
    orderBy: { createdAt: "asc" },
  });

  const byMeal = Object.fromEntries(
    MEAL_ORDER.map((meal) => [
      meal,
      logs
        .filter((l) => l.meal === meal)
        .map((l) => ({
          id: l.id,
          foodId: l.foodId,
          name: l.food.name,
          brand: l.food.brand,
          grams: Number(l.grams),
          kcal: Number(l.kcal),
          protein: Number(l.protein),
          carbs: Number(l.carbs),
          fat: Number(l.fat),
        })),
    ])
  );

  const totals = logs.reduce(
    (acc, l) => ({
      kcal: acc.kcal + Number(l.kcal),
      protein: acc.protein + Number(l.protein),
      carbs: acc.carbs + Number(l.carbs),
      fat: acc.fat + Number(l.fat),
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 }
  );

  return NextResponse.json({ date: dateStr, byMeal, totals });
}

const logSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  meal: z.enum(["desayuno", "almuerzo", "comida", "merienda", "cena"]),
  foodId: z.string().uuid(),
  grams: z.number().positive().max(5000),
});

export async function POST(request: Request) {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await request.json();
  const parsed = logSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { date: dateStr, meal, foodId, grams } = parsed.data;

  const food = await prisma.food.findUnique({
    where: { id: foodId, isActive: true },
    select: { calories: true, protein: true, carbs: true, fat: true },
  });
  if (!food) return NextResponse.json({ error: "Alimento no encontrado" }, { status: 404 });

  const ratio = grams / 100;
  const log = await prisma.diaryLog.create({
    data: {
      userId: user.id,
      date: new Date(dateStr + "T00:00:00.000Z"),
      meal,
      foodId,
      grams,
      kcal: Math.round(Number(food.calories) * ratio * 10) / 10,
      protein: Math.round(Number(food.protein) * ratio * 100) / 100,
      carbs: Math.round(Number(food.carbs) * ratio * 100) / 100,
      fat: Math.round(Number(food.fat) * ratio * 100) / 100,
    },
    include: { food: { select: { name: true, brand: true } } },
  });

  return NextResponse.json({
    id: log.id,
    name: log.food.name,
    brand: log.food.brand,
    grams: Number(log.grams),
    kcal: Number(log.kcal),
    protein: Number(log.protein),
    carbs: Number(log.carbs),
    fat: Number(log.fat),
  }, { status: 201 });
}
