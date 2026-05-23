import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { calcDominantMacro } from "@/lib/equivalencias/algorithm";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  brand: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  calories: z.number().min(0).optional(),
  protein: z.number().min(0).optional(),
  carbs: z.number().min(0).optional(),
  fat: z.number().min(0).optional(),
  fiber: z.number().min(0).nullable().optional(),
  isActive: z.boolean().optional(),
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

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const food = await prisma.food.findUnique({ where: { id } });
  if (!food) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  return NextResponse.json({
    ...food,
    calories: Number(food.calories),
    protein: Number(food.protein),
    carbs: Number(food.carbs),
    fat: Number(food.fat),
    fiber: food.fiber ? Number(food.fiber) : null,
  });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await getSupabaseServerClient();
  const admin = await requireAdmin(supabase);
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { id } = await params;
  const body = await request.json() as unknown;
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  // Recalculate dominant macro if macros changed
  let dominantMacro;
  if (data.protein !== undefined || data.carbs !== undefined || data.fat !== undefined) {
    const existing = await prisma.food.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    dominantMacro = calcDominantMacro(
      data.protein ?? Number(existing.protein),
      data.carbs ?? Number(existing.carbs),
      data.fat ?? Number(existing.fat)
    );
  }

  const food = await prisma.food.update({
    where: { id },
    data: { ...data, ...(dominantMacro ? { dominantMacro } : {}) },
  });

  return NextResponse.json({
    ...food,
    calories: Number(food.calories),
    protein: Number(food.protein),
    carbs: Number(food.carbs),
    fat: Number(food.fat),
    fiber: food.fiber ? Number(food.fiber) : null,
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await getSupabaseServerClient();
  const admin = await requireAdmin(supabase);
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { id } = await params;
  await prisma.food.update({ where: { id }, data: { isActive: false } });
  return NextResponse.json({ success: true });
}
