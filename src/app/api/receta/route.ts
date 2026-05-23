import { NextResponse } from "next/server";
import { getRecipeAlternativas } from "@/lib/equivalencias/algorithm";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { z } from "zod";

const recetaSchema = z.object({
  foods: z
    .array(
      z.object({
        food_id: z.string().uuid(),
        quantity: z.number().min(1).max(5000),
      })
    )
    .min(1)
    .max(20),
});

export async function POST(request: Request) {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await request.json() as unknown;
  const parsed = recetaSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const alternativas = await getRecipeAlternativas(
    parsed.data.foods.map((f) => ({ foodId: f.food_id, quantity: f.quantity }))
  );

  return NextResponse.json({ alternativas });
}
