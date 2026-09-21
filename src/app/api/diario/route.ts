import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const DEFAULT_MEALS = ["Desayuno", "Almuerzo", "Comida", "Merienda", "Cena"];

async function ensureDefaultMeals(userId: string) {
  const count = await prisma.userMeal.count({ where: { userId } });
  if (count === 0) {
    await prisma.userMeal.createMany({
      data: DEFAULT_MEALS.map((name, i) => ({ userId, name, order: i })),
    });
  }
}

export async function GET(request: Request) {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const dateStr = searchParams.get("date") ?? new Date().toLocaleDateString("sv-SE");

  const date = new Date(dateStr + "T00:00:00.000Z");

  // Auto-create default meals for new users
  await ensureDefaultMeals(user.id);

  // Get daily targets from user profile
  const userProfile = await prisma.user.findUnique({
    where: { id: user.id },
    select: { dailyKcal: true, dailyProtein: true, dailyCarbs: true, dailyFat: true },
  });

  // Get all user meals in order
  const meals = await prisma.userMeal.findMany({
    where: { userId: user.id },
    orderBy: { order: "asc" },
    select: {
      id: true,
      name: true,
      order: true,
      targetKcal: true,
      targetProtein: true,
      targetCarbs: true,
      targetFat: true,
    },
  });

  // Get all diary logs for the day
  const logs = await prisma.diaryLog.findMany({
    where: { userId: user.id, date },
    include: { food: { select: { name: true, brand: true } } },
    orderBy: { createdAt: "asc" },
  });

  const byMeal = meals.map((meal) => ({
    id: meal.id,
    name: meal.name,
    order: meal.order,
    targetKcal: meal.targetKcal ? Number(meal.targetKcal) : null,
    targetProtein: meal.targetProtein ? Number(meal.targetProtein) : null,
    targetCarbs: meal.targetCarbs ? Number(meal.targetCarbs) : null,
    targetFat: meal.targetFat ? Number(meal.targetFat) : null,
    entries: logs
      .filter((l) => l.userMealId === meal.id)
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
  }));

  const totals = logs.reduce(
    (acc, l) => ({
      kcal: acc.kcal + Number(l.kcal),
      protein: acc.protein + Number(l.protein),
      carbs: acc.carbs + Number(l.carbs),
      fat: acc.fat + Number(l.fat),
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const dailyTargets = userProfile ? {
    kcal: userProfile.dailyKcal ? Number(userProfile.dailyKcal) : null,
    protein: userProfile.dailyProtein ? Number(userProfile.dailyProtein) : null,
    carbs: userProfile.dailyCarbs ? Number(userProfile.dailyCarbs) : null,
    fat: userProfile.dailyFat ? Number(userProfile.dailyFat) : null,
  } : null;

  return NextResponse.json({ date: dateStr, meals: byMeal, totals, dailyTargets });
}

const logSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  userMealId: z.string().uuid(),
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

  const { date: dateStr, userMealId, foodId, grams } = parsed.data;

  // Verify meal belongs to user
  const meal = await prisma.userMeal.findUnique({ where: { id: userMealId } });
  if (!meal || meal.userId !== user.id) {
    return NextResponse.json({ error: "Comida no encontrada" }, { status: 404 });
  }

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
      userMealId,
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
