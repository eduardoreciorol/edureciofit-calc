/**
 * Importa alimentos desde OpenFoodFacts a la base de datos.
 * Ejecutar: pnpm dlx tsx scripts/import-openfoodfacts.ts
 *
 * - Descarga por categorías (carnes, pescados, lácteos, cereales…)
 * - Filtra solo productos con macros completos y coherentes
 * - Usa el código de barras OFF (offId) como clave única para upsert
 * - Calcula dominant_macro en el servidor
 */

import { PrismaClient, DominantMacro, FoodSource } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { config } from "dotenv";

config({ path: ".env.local" });

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// ─── Tipos OpenFoodFacts ─────────────────────────────────────────────────────

interface OFFProduct {
  code?: string;
  product_name?: string;
  product_name_es?: string;
  product_name_en?: string;
  nutriments?: {
    "energy-kcal_100g"?: number;
    proteins_100g?: number;
    carbohydrates_100g?: number;
    fat_100g?: number;
    fiber_100g?: number;
  };
  brands?: string;
  categories_tags?: string[];
}

interface OFFResponse {
  products: OFFProduct[];
  count: number;
}

// ─── Categorías a importar ───────────────────────────────────────────────────

const CATEGORIES = [
  // Proteínas animales
  "chicken",
  "beef",
  "pork",
  "turkey",
  "lamb",
  "fish",
  "salmon",
  "tuna",
  "cod",
  "shrimp",
  "eggs",
  // Lácteos
  "yogurts",
  "cheeses",
  "milks",
  "cottage-cheese",
  "quark",
  // Cereales y carbohidratos
  "rices",
  "pastas",
  "breads",
  "oats",
  "potatoes",
  "sweet-potatoes",
  "quinoa",
  // Legumbres
  "lentils",
  "chickpeas",
  "beans",
  "soybeans",
  "peas",
  // Frutas
  "bananas",
  "apples",
  "oranges",
  "strawberries",
  "grapes",
  "mangoes",
  "blueberries",
  "pineapples",
  // Verduras
  "broccoli",
  "spinach",
  "tomatoes",
  "carrots",
  "zucchinis",
  "peppers",
  "lettuce",
  "cucumbers",
  "onions",
  "garlic",
  // Grasas y frutos secos
  "olive-oils",
  "almonds",
  "walnuts",
  "peanuts",
  "avocados",
  "sunflower-seeds",
  "chia-seeds",
  // Suplementos deportivos
  "protein-powders",
  "protein-bars",
  // Extras
  "dark-chocolates",
  "peanut-butters",
  "honey",
];

const PAGES_PER_CATEGORY = 3; // 3 × 100 = hasta 300 por categoría
const PAGE_SIZE = 100;
const DELAY_MS = 350; // respetar rate limit de OFF

// ─── Algoritmo macro dominante ───────────────────────────────────────────────

function calcDominantMacro(
  protein: number,
  carbs: number,
  fat: number
): DominantMacro {
  const protCal = protein * 4;
  const carbCal = carbs * 4;
  const fatCal = fat * 9;
  const total = protCal + carbCal + fatCal;
  if (total === 0) return DominantMacro.carbs;

  const pct = { p: protCal / total, c: carbCal / total, f: fatCal / total };

  if (pct.p >= 0.4 && pct.f >= 0.25) return DominantMacro.protein_fat;
  if (pct.p >= 0.4 && pct.c >= 0.25) return DominantMacro.protein_carbs;
  if (pct.p >= 0.4) return DominantMacro.protein;
  if (pct.f >= 0.4) return DominantMacro.fat;
  return DominantMacro.carbs;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

function isValid(p: OFFProduct): boolean {
  if (!p.code) return false;
  const n = p.nutriments;
  if (!n) return false;

  const kcal = n["energy-kcal_100g"] ?? -1;
  const prot = n["proteins_100g"] ?? -1;
  const carb = n["carbohydrates_100g"] ?? -1;
  const fat = n["fat_100g"] ?? -1;

  if (kcal < 0 || prot < 0 || carb < 0 || fat < 0) return false;
  if (kcal > 950 || prot > 100 || carb > 100 || fat > 100) return false;
  if (prot + carb + fat > 105) return false;

  const name = p.product_name_es || p.product_name || p.product_name_en;
  return !!name && name.trim().length >= 2;
}

// ─── Fetch con reintentos ────────────────────────────────────────────────────

async function fetchCategory(
  category: string,
  page: number
): Promise<OFFProduct[]> {
  const url =
    `https://world.openfoodfacts.org/cgi/search.pl` +
    `?action=process&json=1` +
    `&tagtype_0=categories&tag_contains_0=contains&tag_0=${encodeURIComponent(category)}` +
    `&fields=code,product_name,product_name_es,product_name_en,brands,nutriments` +
    `&page_size=${PAGE_SIZE}&page=${page}` +
    `&sort_by=unique_scans_n`;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "edureciofit-calc/1.0 (edureciofit.com)" },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as OFFResponse;
      return data.products || [];
    } catch (e) {
      if (attempt === 3) {
        console.warn(`  ⚠️  Fallo en ${category} p${page}: ${e}`);
        return [];
      }
      await sleep(1000 * attempt);
    }
  }
  return [];
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🥦 Iniciando importación desde OpenFoodFacts…\n");

  // Cargar offIds ya en BD para skip rápido
  const existingIds = new Set(
    (
      await prisma.food.findMany({
        where: { offId: { not: null } },
        select: { offId: true },
      })
    ).map((f) => f.offId!)
  );
  console.log(`ℹ️  Alimentos OFF ya en BD: ${existingIds.size}`);

  let totalUpserted = 0;
  let totalSkipped = 0;

  for (const category of CATEGORIES) {
    console.log(`\n📦  ${category}`);
    let catNew = 0;

    for (let page = 1; page <= PAGES_PER_CATEGORY; page++) {
      await sleep(DELAY_MS);
      const products = await fetchCategory(category, page);
      if (products.length === 0) break;

      const batch: Array<Parameters<typeof prisma.food.upsert>[0]> = [];

      for (const p of products) {
        if (!isValid(p)) { totalSkipped++; continue; }

        const offId = p.code!;
        if (existingIds.has(offId)) { totalSkipped++; continue; }
        existingIds.add(offId);

        const rawName =
          p.product_name_es || p.product_name || p.product_name_en || "";
        const name =
          (rawName.charAt(0).toUpperCase() + rawName.slice(1)).substring(0, 120);

        const n = p.nutriments!;
        const protein = round1(n["proteins_100g"] ?? 0);
        const carbs = round1(n["carbohydrates_100g"] ?? 0);
        const fat = round1(n["fat_100g"] ?? 0);
        const calories = round1(n["energy-kcal_100g"] ?? 0);
        const fiber =
          n["fiber_100g"] != null ? round1(n["fiber_100g"]) : null;
        const brand = p.brands ? p.brands.split(",")[0]!.trim().substring(0, 80) : null;
        const dominantMacro = calcDominantMacro(protein, carbs, fat);

        batch.push({
          where: { offId },
          update: { calories, protein, carbs, fat, fiber, dominantMacro, isActive: true },
          create: {
            name,
            brand,
            calories,
            protein,
            carbs,
            fat,
            fiber,
            dominantMacro,
            source: FoodSource.openfoodfacts,
            offId,
            isActive: true,
          },
        });
      }

      if (batch.length === 0) continue;

      // Upsert individual (sin transaction para evitar timeout en Neon pooler)
      // Concurrencia de 10 para no saturar la conexión
      for (let i = 0; i < batch.length; i += 10) {
        const chunk = batch.slice(i, i + 10);
        await Promise.all(chunk.map((args) => prisma.food.upsert(args)));
      }

      catNew += batch.length;
      totalUpserted += batch.length;
      process.stdout.write(`  p${page}:+${batch.length} `);
    }

    console.log(`→ ${catNew} nuevos`);
  }

  const total = await prisma.food.count({ where: { isActive: true } });
  console.log(`\n✅ Importación completa`);
  console.log(`   Insertados/actualizados : ${totalUpserted}`);
  console.log(`   Omitidos                : ${totalSkipped}`);
  console.log(`   Total alimentos activos : ${total}`);

  await prisma.$disconnect();
}

void main().catch((e) => {
  console.error(e);
  process.exit(1);
});
