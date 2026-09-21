import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const querySchema = z.object({
  userMealId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  macro: z.enum(["protein", "carbs", "fat"]),
});

export async function GET(request: Request) {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    userMealId: searchParams.get("userMealId"),
    date: searchParams.get("date"),
    macro: searchParams.get("macro"),
  });
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { userMealId, date, macro } = parsed.data;

  const meal = await prisma.userMeal.findUnique({
    where: { id: userMealId },
    select: { userId: true, targetProtein: true, targetCarbs: true, targetFat: true },
  });
  if (!meal || meal.userId !== user.id) {
    return NextResponse.json({ error: "Comida no encontrada" }, { status: 404 });
  }

  // Calculate what's already logged
  const logs = await prisma.diaryLog.aggregate({
    where: { userId: user.id, userMealId, date: new Date(date + "T00:00:00.000Z") },
    _sum: { protein: true, carbs: true, fat: true },
  });

  const loggedP = Number(logs._sum.protein ?? 0);
  const loggedC = Number(logs._sum.carbs ?? 0);
  const loggedF = Number(logs._sum.fat ?? 0);

  const targetP = meal.targetProtein ? Number(meal.targetProtein) : null;
  const targetC = meal.targetCarbs ? Number(meal.targetCarbs) : null;
  const targetF = meal.targetFat ? Number(meal.targetFat) : null;

  const remaining = {
    protein: targetP !== null ? Math.max(0, targetP - loggedP) : null,
    carbs: targetC !== null ? Math.max(0, targetC - loggedC) : null,
    fat: targetF !== null ? Math.max(0, targetF - loggedF) : null,
  };

  const remainingForMacro = remaining[macro];
  if (remainingForMacro === null) {
    return NextResponse.json({ error: "Sin objetivo para ese macro" }, { status: 400 });
  }
  if (remainingForMacro <= 0) {
    return NextResponse.json({ suggestions: [], remaining, message: "Macro ya completado" });
  }

  // Find foods rich in the target macro
  const macroField = macro === "protein" ? "protein" : macro === "carbs" ? "carbs" : "fat";

  const candidates = await prisma.food.findMany({
    where: {
      isActive: true,
      source: { in: ["harbiz", "custom"] },
    },
    orderBy: { [macroField]: "desc" },
    take: 50,
    select: {
      id: true,
      name: true,
      brand: true,
      calories: true,
      protein: true,
      carbs: true,
      fat: true,
    },
  });

  // Calculate grams needed for each food to hit remaining macro
  const suggestions = candidates
    .map((food) => {
      const per100 = Number(food[macroField]);
      if (per100 <= 0) return null;
      const grams = Math.round((remainingForMacro / per100) * 100);
      if (grams < 10 || grams > 1000) return null;

      const ratio = grams / 100;
      return {
        id: food.id,
        name: food.name,
        brand: food.brand,
        grams,
        kcal: Math.round(Number(food.calories) * ratio),
        protein: parseFloat((Number(food.protein) * ratio).toFixed(1)),
        carbs: parseFloat((Number(food.carbs) * ratio).toFixed(1)),
        fat: parseFloat((Number(food.fat) * ratio).toFixed(1)),
      };
    })
    .filter(Boolean)
    .slice(0, 5);

  return NextResponse.json({ suggestions, remaining });
}
