import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const updateSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  order: z.number().int().min(0).optional(),
  targetKcal: z.number().positive().nullable().optional(),
  targetProtein: z.number().positive().nullable().optional(),
  targetCarbs: z.number().positive().nullable().optional(),
  targetFat: z.number().positive().nullable().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const meal = await prisma.userMeal.findUnique({ where: { id } });
  if (!meal || meal.userId !== user.id) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  const updated = await prisma.userMeal.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json({
    id: updated.id,
    name: updated.name,
    order: updated.order,
    targetKcal: updated.targetKcal ? Number(updated.targetKcal) : null,
    targetProtein: updated.targetProtein ? Number(updated.targetProtein) : null,
    targetCarbs: updated.targetCarbs ? Number(updated.targetCarbs) : null,
    targetFat: updated.targetFat ? Number(updated.targetFat) : null,
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;

  const meal = await prisma.userMeal.findUnique({
    where: { id },
    include: { _count: { select: { diaryLogs: true } } },
  });

  if (!meal || meal.userId !== user.id) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  if (meal._count.diaryLogs > 0) {
    return NextResponse.json(
      { error: `Esta comida tiene ${meal._count.diaryLogs} registros en el diario. Bórrelos primero o la comida se eliminará con ellos.`, hasLogs: true, logCount: meal._count.diaryLogs },
      { status: 409 }
    );
  }

  await prisma.userMeal.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
