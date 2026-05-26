/**
 * Importa la biblioteca de alimentos de Harbiz (42 000+ items).
 *
 * Lee scripts/harbiz-foods-raw.json y hace upsert en la tabla foods:
 * - Deduplica por nombre normalizado (conserva el primero)
 * - Descarta alimentos con todos los macros a 0
 * - dominant_macro calculado en servidor
 * - source = "harbiz"
 *
 * Ejecutar: pnpm dlx tsx scripts/import-harbiz-foods.ts
 */

import { PrismaClient, DominantMacro, FoodSource } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { config } from "dotenv";
import { readFileSync } from "fs";
import { join } from "path";

config({ path: ".env.local" });

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// ─── Tipos ──────────────────────────────────────────────────────────────────

interface HarbizFood {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

// ─── dominant_macro (idéntica a algorithm.ts) ────────────────────────────────

function calcDominantMacro(
  protein: number,
  carbs: number,
  fat: number
): DominantMacro {
  const proteinCals = protein * 4;
  const carbsCals = carbs * 4;
  const fatCals = fat * 9;
  const total = proteinCals + carbsCals + fatCals;

  if (total === 0) return "carbs";

  const pPct = proteinCals / total;
  const cPct = carbsCals / total;
  const fPct = fatCals / total;

  if (pPct > 0.25 && fPct > 0.25 && Math.abs(pPct - fPct) < 0.2)
    return "protein_fat";
  if (pPct > 0.25 && cPct > 0.25 && Math.abs(pPct - cPct) < 0.2)
    return "protein_carbs";

  if (cPct >= pPct && cPct >= fPct) return "carbs";
  if (pPct >= cPct && pPct >= fPct) return "protein";
  return "fat";
}

function normalizeName(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("📂 Leyendo harbiz-foods-raw.json…");
  const raw: HarbizFood[] = JSON.parse(
    readFileSync(join(process.cwd(), "scripts", "harbiz-foods-raw.json"), "utf8")
  );
  console.log(`   Total leídos: ${raw.length.toLocaleString()}`);

  // Deduplicar por nombre normalizado (primero gana)
  const seen = new Set<string>();
  const deduped: HarbizFood[] = [];
  for (const food of raw) {
    const key = normalizeName(food.name);
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(food);
    }
  }
  console.log(`   Únicos (post-dedup): ${deduped.length.toLocaleString()}`);

  // Descartar todo-cero
  const valid = deduped.filter(
    (f) => !(f.protein === 0 && f.carbs === 0 && f.fat === 0)
  );
  console.log(`   Válidos (excl. todo-cero): ${valid.length.toLocaleString()}`);

  // Borrar harbiz previos para reimportar limpio
  const deleted = await prisma.food.deleteMany({
    where: { source: FoodSource.harbiz },
  });
  console.log(`🗑️  Harbiz previos eliminados: ${deleted.count.toLocaleString()}`);

  // Insertar en lotes de 500
  const BATCH = 500;
  let inserted = 0;
  let skipped = 0;

  for (let i = 0; i < valid.length; i += BATCH) {
    const chunk = valid.slice(i, i + BATCH);

    const rows = chunk.map((food) => ({
      name: food.name.trim(),
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
      fiber: food.fiber ?? 0,
      dominantMacro: calcDominantMacro(food.protein, food.carbs, food.fat),
      source: FoodSource.harbiz,
      isActive: true,
    }));

    try {
      await prisma.food.createMany({ data: rows, skipDuplicates: true });
      inserted += rows.length;
    } catch (err) {
      console.error(`   ⚠️ Error en lote ${i}–${i + BATCH}:`, err);
      skipped += rows.length;
    }

    if ((i / BATCH) % 20 === 0) {
      process.stdout.write(
        `   Progreso: ${inserted.toLocaleString()} / ${valid.length.toLocaleString()}\r`
      );
    }
  }

  console.log(`\n✅ Insertados: ${inserted.toLocaleString()}`);
  if (skipped > 0) console.warn(`⚠️  Saltados por error: ${skipped}`);

  // Verificación final
  const total = await prisma.food.count({ where: { source: FoodSource.harbiz } });
  console.log(`📊 Total harbiz en BD: ${total.toLocaleString()}`);
}

main()
  .catch((e) => {
    console.error("Error fatal:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
