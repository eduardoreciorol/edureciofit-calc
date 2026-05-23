import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { calcDominantMacro } from "@/lib/equivalencias/algorithm";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1),
  brand: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  calories: z.number().min(0),
  protein: z.number().min(0),
  carbs: z.number().min(0),
  fat: z.number().min(0),
  fiber: z.number().min(0).nullable().optional(),
});

async function requireAdmin(supabase: Awaited<ReturnType<typeof getSupabaseServerClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("users")
    .select("role, is_active")
    .eq("id", user.id)
    .single();
  if (!data || data.role !== "admin" || !data.is_active) return null;
  return user;
}

export async function GET(request: Request) {
  const supabase = await getSupabaseServerClient();
  const admin = await requireAdmin(supabase);
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const category = searchParams.get("category");
  const activeOnly = searchParams.get("active") !== "false";
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const limit = 20;

  const where = {
    ...(activeOnly ? { isActive: true } : {}),
    ...(category ? { category } : {}),
    ...(q.length >= 2
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { brand: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [foods, total] = await Promise.all([
    prisma.food.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.food.count({ where }),
  ]);

  const serialized = foods.map((f) => ({
    ...f,
    calories: Number(f.calories),
    protein: Number(f.protein),
    carbs: Number(f.carbs),
    fat: Number(f.fat),
    fiber: f.fiber ? Number(f.fiber) : null,
  }));

  return NextResponse.json({ foods: serialized, total, page, limit });
}

export async function POST(request: Request) {
  const supabase = await getSupabaseServerClient();
  const admin = await requireAdmin(supabase);
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const body = await request.json() as unknown;
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { name, brand, category, calories, protein, carbs, fat, fiber } = parsed.data;
  const dominantMacro = calcDominantMacro(protein, carbs, fat);

  const food = await prisma.food.create({
    data: {
      name,
      brand: brand ?? null,
      category: category ?? null,
      calories,
      protein,
      carbs,
      fat,
      fiber: fiber ?? null,
      dominantMacro,
      source: "custom",
      createdById: admin.id,
    },
  });

  return NextResponse.json(
    {
      ...food,
      calories: Number(food.calories),
      protein: Number(food.protein),
      carbs: Number(food.carbs),
      fat: Number(food.fat),
      fiber: food.fiber ? Number(food.fiber) : null,
    },
    { status: 201 }
  );
}
