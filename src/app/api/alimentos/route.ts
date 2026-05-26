import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { DominantMacro } from "@/types";

// ── Normalizer (sin tildes, minúsculas, sin puntuación) ──────────
function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ── Scorer: prioriza genéricos cuando el usuario no especifica marca ─
//
// Reglas (mayor puntuación → aparece antes):
//   +1000  nombre normalizado es EXACTAMENTE igual al query
//   +600   nombre empieza por el query (ej. query="pollo" → "Pollo asado")
//   +300   nombre contiene el query como palabra completa
//   +400   alimento SIN marca (es el valor genérico)
//   +500   la marca del alimento aparece en el query (usuario la especificó)
//   -15×N  penalización por cada palabra extra del nombre (más palabras = más específico)
//   +80    fuente "custom" (alimentos curados por Eduardo)
//
// Ejemplo "pollo":
//   "Pollo"                    → 1000+400     = 1400  ✅ primero
//   "Pollo asado"              → 600+400-15   =  985
//   "Pollo - Mercadona"        → 600+0-15     =  585
//   "Pechuga de pollo"         → 300+400-30   =  670
//
// Ejemplo "arroz basmati brillante":
//   "Arroz basmati - Brillante" → 600+500-15  = 1085  ✅ primero (marca en query)
//   "Arroz basmati"             → 1000+400-15 = 1385  ← gana si no hay marca en query
//
function scoreFood(
  name: string,
  brand: string | null,
  source: string,
  query: string
): number {
  const nq = norm(query);
  const nn = norm(name);
  const nb = brand ? norm(brand) : null;

  let score = 0;

  // Coincidencia de nombre
  if (nn === nq) {
    score += 1000;
  } else if (nn.startsWith(nq + " ") || nn.startsWith(nq)) {
    score += 600;
  } else if (nn.includes(" " + nq + " ") || nn.includes(" " + nq) || nn.includes(nq + " ")) {
    score += 300;
  }

  // Genérico vs específico
  if (!brand) {
    score += 400; // sin marca → genérico
  } else if (nb && nq.includes(nb)) {
    score += 500; // el usuario especificó esta marca → subirla
  }

  // Penalización por longitud (más palabras = más específico)
  const wordCount = nn.split(" ").length;
  score -= wordCount * 15;

  // Bonus para alimentos curados por Eduardo
  if (source === "custom") score += 80;

  return score;
}

export async function GET(request: Request) {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const limit = Math.min(Number(searchParams.get("limit") ?? "10"), 50);
  const category = searchParams.get("category");

  if (q.length < 2) {
    return NextResponse.json({ foods: [] });
  }

  // Traemos más candidatos para poder re-rankear correctamente
  const candidates = await prisma.food.findMany({
    where: {
      isActive: true,
      ...(category ? { category } : {}),
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { brand: { contains: q, mode: "insensitive" } },
      ],
    },
    take: 120, // pool amplio → scoring elige los mejores
    select: {
      id: true,
      name: true,
      brand: true,
      category: true,
      calories: true,
      protein: true,
      carbs: true,
      fat: true,
      fiber: true,
      dominantMacro: true,
      source: true,
      offId: true,
      isActive: true,
      createdById: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  // Re-rankear por relevancia
  const scored = candidates
    .map((f) => ({
      food: f,
      score: scoreFood(f.name, f.brand, f.source, q),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ food: f }) => ({
      ...f,
      calories: Number(f.calories),
      protein: Number(f.protein),
      carbs: Number(f.carbs),
      fat: Number(f.fat),
      fiber: f.fiber ? Number(f.fiber) : null,
      dominantMacro: f.dominantMacro as DominantMacro,
    }));

  return NextResponse.json({ foods: scored });
}
