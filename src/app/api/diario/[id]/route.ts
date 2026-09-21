import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;

  const log = await prisma.diaryLog.findUnique({ where: { id } });
  if (!log || log.userId !== user.id) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  await prisma.diaryLog.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

const patchSchema = z.object({ grams: z.number().positive().max(5000) });

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const log = await prisma.diaryLog.findUnique({
    where: { id },
    include: { food: { select: { calories: true, protein: true, carbs: true, fat: true } } },
  });
  if (!log || log.userId !== user.id) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  const { grams } = parsed.data;
  const ratio = grams / 100;
  const updated = await prisma.diaryLog.update({
    where: { id },
    data: {
      grams,
      kcal: Math.round(Number(log.food.calories) * ratio * 10) / 10,
      protein: Math.round(Number(log.food.protein) * ratio * 100) / 100,
      carbs: Math.round(Number(log.food.carbs) * ratio * 100) / 100,
      fat: Math.round(Number(log.food.fat) * ratio * 100) / 100,
    },
  });

  return NextResponse.json({
    id: updated.id,
    grams: Number(updated.grams),
    kcal: Number(updated.kcal),
    protein: Number(updated.protein),
    carbs: Number(updated.carbs),
    fat: Number(updated.fat),
  });
}
