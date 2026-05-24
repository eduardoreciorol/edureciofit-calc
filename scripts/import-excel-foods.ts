/**
 * Importa la Biblioteca de Alimentos del Excel de Eduardo Recio.
 *
 * Estrategia:
 * 1. Lee /tmp/excel_foods.json (generado por extract-excel.py)
 * 2. Inserta cada alimento como source=custom con los macros del Excel
 * 3. Si hay un alimento OFF en la BD con nombre muy similar, actualiza sus macros
 *    con los valores confiables del Excel
 *
 * Ejecutar: pnpm dlx tsx scripts/import-excel-foods.ts
 */

import { PrismaClient, DominantMacro, FoodSource } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { config } from "dotenv";
import { readFileSync } from "fs";

config({ path: ".env.local" });

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// ─── Tipos ─────────────────────────────────────────────────────────────────

interface ExcelFood {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  note: string;
}

// ─── Normalización para fuzzy match ─────────────────────────────────────────

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // quitar tildes
    .replace(/[()]/g, " ")          // paréntesis → espacio
    .replace(/[^a-z0-9\s]/g, "")    // solo alfanumérico
    .replace(/\s+/g, " ")
    .trim();
}

// Similitud de palabras en común (Jaccard sobre tokens)
function similarity(a: string, b: string): number {
  const tokA = new Set(normalize(a).split(" ").filter((t) => t.length > 2));
  const tokB = new Set(normalize(b).split(" ").filter((t) => t.length > 2));
  if (tokA.size === 0 || tokB.size === 0) return 0;
  const intersection = [...tokA].filter((t) => tokB.has(t)).length;
  const union = new Set([...tokA, ...tokB]).size;
  return intersection / union;
}

// ─── Macro dominante ────────────────────────────────────────────────────────

function calcDominantMacro(p: number, c: number, f: number): DominantMacro {
  const pCal = p * 4, cCal = c * 4, fCal = f * 9;
  const total = pCal + cCal + fCal;
  if (total === 0) return DominantMacro.carbs;
  const pp = pCal / total, cp = cCal / total, fp = fCal / total;
  if (pp >= 0.4 && fp >= 0.25) return DominantMacro.protein_fat;
  if (pp >= 0.4 && cp >= 0.25) return DominantMacro.protein_carbs;
  if (pp >= 0.4) return DominantMacro.protein;
  if (fp >= 0.4) return DominantMacro.fat;
  return DominantMacro.carbs;
}

function round2(n: number) { return Math.round(n * 100) / 100; }

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log("📊 Importando Biblioteca de Alimentos de Eduardo Recio…\n");

  const excelFoods: ExcelFood[] = JSON.parse(
    readFileSync("/tmp/excel_foods.json", "utf-8")
  );
  console.log(`ℹ️  Alimentos en Excel: ${excelFoods.length}`);

  // Cargar todos los alimentos OFF de la BD para cruzar
  const offFoods = await prisma.food.findMany({
    where: { source: FoodSource.openfoodfacts, isActive: true },
    select: { id: true, name: true },
  });
  console.log(`ℹ️  Alimentos OFF en BD: ${offFoods.length}`);

  let inserted = 0;
  let updated = 0;
  let matched = 0;

  for (const ef of excelFoods) {
    // Capitalizar nombre
    const name = ef.name.charAt(0) + ef.name.slice(1).toLowerCase();
    const dominantMacro = calcDominantMacro(ef.protein, ef.carbs, ef.fat);

    // 1 — Insertar/actualizar como alimento custom (datos de confianza de Eduardo)
    const existing = await prisma.food.findFirst({
      where: {
        name: { equals: name, mode: "insensitive" },
        source: FoodSource.custom,
      },
      select: { id: true },
    });

    if (existing) {
      await prisma.food.update({
        where: { id: existing.id },
        data: {
          calories: round2(ef.calories),
          protein: round2(ef.protein),
          carbs: round2(ef.carbs),
          fat: round2(ef.fat),
          dominantMacro,
          isActive: true,
        },
      });
      updated++;
    } else {
      await prisma.food.create({
        data: {
          name,
          calories: round2(ef.calories),
          protein: round2(ef.protein),
          carbs: round2(ef.carbs),
          fat: round2(ef.fat),
          dominantMacro,
          source: FoodSource.custom,
          isActive: true,
        },
      });
      inserted++;
    }

    // 2 — Cruzar con OFF: buscar el alimento con mayor similitud
    const SIM_THRESHOLD = 0.55; // mínimo 55% palabras en común
    let bestSim = 0;
    let bestId: string | null = null;
    let bestName = "";

    for (const off of offFoods) {
      const sim = similarity(ef.name, off.name);
      if (sim > bestSim) { bestSim = sim; bestId = off.id; bestName = off.name; }
    }

    if (bestId && bestSim >= SIM_THRESHOLD) {
      await prisma.food.update({
        where: { id: bestId },
        data: {
          calories: round2(ef.calories),
          protein: round2(ef.protein),
          carbs: round2(ef.carbs),
          fat: round2(ef.fat),
          dominantMacro,
        },
      });
      matched++;
      console.log(
        `  🔗 [${bestSim.toFixed(2)}] "${ef.name}" → "${bestName}"`
      );
    }
  }

  const total = await prisma.food.count({ where: { isActive: true } });
  console.log(`\n✅ Completado`);
  console.log(`   Insertados (custom nuevo)   : ${inserted}`);
  console.log(`   Actualizados (custom exist.) : ${updated}`);
  console.log(`   OFF actualizados con macros  : ${matched}`);
  console.log(`   Total alimentos activos      : ${total}`);

  await prisma.$disconnect();
}

void main().catch((e) => { console.error(e); process.exit(1); });
