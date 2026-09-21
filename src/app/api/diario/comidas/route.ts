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

export async function GET() {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  await ensureDefaultMeals(user.id);

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

  return NextResponse.json({
    meals: meals.map((m) => ({
      id: m.id,
      name: m.name,
      order: m.order,
      targetKcal: m.targetKcal ? Number(m.targetKcal) : null,
      targetProtein: m.targetProtein ? Number(m.targetProtein) : null,
      targetCarbs: m.targetCarbs ? Number(m.targetCarbs) : null,
      targetFat: m.targetFat ? Number(m.targetFat) : null,
    })),
  });
}

const createSchema = z.object({ name: z.string().min(1).max(50) });

export async function POST(request: Request) {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const maxOrder = await prisma.userMeal.aggregate({
    where: { userId: user.id },
    _max: { order: true },
  });

  const meal = await prisma.userMeal.create({
    data: {
      userId: user.id,
      name: parsed.data.name,
      order: (maxOrder._max.order ?? -1) + 1,
    },
  });

  return NextResponse.json({
    id: meal.id,
    name: meal.name,
    order: meal.order,
    targetKcal: null,
    targetProtein: null,
    targetCarbs: null,
    targetFat: null,
  }, { status: 201 });
}
