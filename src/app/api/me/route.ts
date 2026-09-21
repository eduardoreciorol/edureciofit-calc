import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, name: true, email: true, harbizEmail: true, role: true, dailyKcal: true, dailyProtein: true, dailyCarbs: true, dailyFat: true },
  });

  if (!profile) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

  return NextResponse.json(profile);
}

const patchSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  harbizEmail: z.string().email().nullable().optional(),
  dailyKcal: z.number().positive().max(10000).nullable().optional(),
  dailyProtein: z.number().min(0).max(1000).nullable().optional(),
  dailyCarbs: z.number().min(0).max(2000).nullable().optional(),
  dailyFat: z.number().min(0).max(500).nullable().optional(),
});

export async function PATCH(request: Request) {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await request.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: parsed.data,
    select: { id: true, name: true, email: true, harbizEmail: true, role: true, dailyKcal: true, dailyProtein: true, dailyCarbs: true, dailyFat: true },
  });

  return NextResponse.json(updated);
}
