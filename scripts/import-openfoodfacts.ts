/**
 * Importa alimentos desde OpenFoodFacts a la base de datos.
 * Ejecutar: pnpm dlx tsx scripts/import-openfoodfacts.ts
 *
 * v2 — Solo español:
 * - Usa es.openfoodfacts.org (endpoint español, devuelve product_name_es más poblado)
 * - Exige product_name_es: si un producto no tiene nombre en español se descarta
 * - Decodifica entidades HTML (&quot; &amp; etc.)
 * - Valida que el nombre no sea basura (códigos, fechas, puros números…)
 * - Limpia todos los alimentos OFF previos antes de reimportar
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
}

interface OFFResponse {
  products: OFFProduct[];
  count: number;
}

// ─── Categorías a importar ───────────────────────────────────────────────────
// Usamos términos en español para que el endpoint español devuelva más resultados
// con product_name_es relleno.

const CATEGORIES = [
  // Proteínas animales
  "pollo",
  "ternera",
  "cerdo",
  "pavo",
  "cordero",
  "pescado",
  "salmon",
  "atun",
  "bacalao",
  "gambas",
  "huevos",
  // Lácteos
  "yogur",
  "queso",
  "leche",
  "queso-fresco",
  "quark",
  // Cereales y carbohidratos
  "arroz",
  "pasta",
  "pan",
  "avena",
  "patata",
  "boniato",
  "quinoa",
  // Legumbres
  "lentejas",
  "garbanzos",
  "alubias",
  "soja",
  "guisantes",
  // Frutas
  "platano",
  "manzana",
  "naranja",
  "fresas",
  "uvas",
  "mango",
  "arandanos",
  "pina",
  // Verduras
  "brocoli",
  "espinacas",
  "tomate",
  "zanahorias",
  "calabacin",        // término español
  "zucchinis",        // término OFF (categoría en inglés, acepta igual product_name_es)
  "pimiento",
  "lechuga",
  "pepino",
  "cebolla",
  "ajo",
  // Grasas y frutos secos
  "aceite-de-oliva",
  "almendras",
  "nueces",
  "cacahuetes",
  "aguacate",
  "pipas-de-girasol",
  "semillas-de-chia",
  // Suplementos — OFF no tiene estas etiquetas en español; usar las inglesas
  "protein-powders",
  "protein-bars",
  // Extras
  "chocolate-negro",
  "peanut-butters",   // OFF no tiene "mantequilla-de-cacahuete" como categoría
  "miel",
];

const PAGES_PER_CATEGORY = 5; // 5 × 100 = hasta 500 por categoría
const PAGE_SIZE = 100;
const DELAY_MS = 400; // respetar rate limit de OFF

// ─── Utilidades ──────────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

/** Decodifica entidades HTML básicas presentes en nombres de OFF */
function decodeHtml(str: string): string {
  return str
    .replace(/&quot;/gi, '"')
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h: string) =>
      String.fromCharCode(parseInt(h, 16))
    )
    .trim();
}

/**
 * Valida que el nombre sea un nombre de alimento real en español.
 * Descarta: códigos de barras, fechas, nombres sin letras, demasiado cortos.
 */
function isValidSpanishName(name: string): boolean {
  if (!name || name.trim().length < 3) return false;

  // Debe contener al menos una letra
  if (!/[a-zA-ZáéíóúüñÁÉÍÓÚÜÑàèìòùâêîôûçÇ]/.test(name)) return false;

  // No puede ser mayoritariamente dígitos (barcode, fecha…)
  const digits = (name.match(/\d/g) ?? []).length;
  if (digits > name.length * 0.4) return false;

  // No puede empezar por punto o número
  if (/^[.\d]/.test(name.trim())) return false;

  // Longitud máxima razonable
  if (name.length > 150) return false;

  return true;
}

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

// ─── Validación de producto ──────────────────────────────────────────────────

function isValidProduct(p: OFFProduct): boolean {
  if (!p.code) return false;

  // ── Debe tener nombre en español ─────────────────────────────────────────
  const rawName = p.product_name_es;
  if (!rawName) return false;
  const name = decodeHtml(rawName);
  if (!isValidSpanishName(name)) return false;

  // ── Macros completos y coherentes ────────────────────────────────────────
  const n = p.nutriments;
  if (!n) return false;

  const kcal = n["energy-kcal_100g"] ?? -1;
  const prot = n["proteins_100g"] ?? -1;
  const carb = n["carbohydrates_100g"] ?? -1;
  const fat = n["fat_100g"] ?? -1;

  if (kcal < 0 || prot < 0 || carb < 0 || fat < 0) return false;
  if (kcal > 950 || prot > 100 || carb > 100 || fat > 100) return false;
  if (prot + carb + fat > 105) return false;

  return true;
}

// ─── Fetch con reintentos ────────────────────────────────────────────────────

async function fetchCategory(
  category: string,
  page: number
): Promise<OFFProduct[]> {
  // Usamos el endpoint español de OFF para obtener más product_name_es
  const url =
    `https://es.openfoodfacts.org/cgi/search.pl` +
    `?action=process&json=1` +
    `&tagtype_0=categories&tag_contains_0=contains&tag_0=${encodeURIComponent(category)}` +
    `&fields=code,product_name_es,product_name,product_name_en,brands,nutriments` +
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
  console.log("🥦 Importando alimentos desde OpenFoodFacts (solo español)…\n");

  // Cargar offIds ya en BD para skip rápido (evita upserts innecesarios)
  const existingIds = new Set(
    (
      await prisma.food.findMany({
        where: { offId: { not: null } },
        select: { offId: true },
      })
    ).map((f) => f.offId!)
  );
  console.log(`ℹ️  Alimentos OFF ya en BD: ${existingIds.size}\n`);
  let totalInserted = 0;
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
        if (!isValidProduct(p)) { totalSkipped++; continue; }

        const offId = p.code!;
        if (existingIds.has(offId)) { totalSkipped++; continue; }
        existingIds.add(offId);

        // Nombre siempre en español, decodificado y capitalizado
        const rawName = decodeHtml(p.product_name_es!);
        const name = (rawName.charAt(0).toUpperCase() + rawName.slice(1))
          .substring(0, 120);

        const n = p.nutriments!;
        const protein  = round1(n["proteins_100g"] ?? 0);
        const carbs    = round1(n["carbohydrates_100g"] ?? 0);
        const fat      = round1(n["fat_100g"] ?? 0);
        const calories = round1(n["energy-kcal_100g"] ?? 0);
        const fiber    = n["fiber_100g"] != null ? round1(n["fiber_100g"]) : null;
        const brand    = p.brands
          ? p.brands.split(",")[0]!.trim().substring(0, 80)
          : null;
        const dominantMacro = calcDominantMacro(protein, carbs, fat);

        batch.push({
          where: { offId },
          update: { name, calories, protein, carbs, fat, fiber, dominantMacro, isActive: true },
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

      // Upserts en chunks de 10 (sin $transaction por timeout Neon)
      for (let i = 0; i < batch.length; i += 10) {
        const chunk = batch.slice(i, i + 10);
        await Promise.all(chunk.map((args) => prisma.food.upsert(args)));
      }

      catNew += batch.length;
      totalInserted += batch.length;
      process.stdout.write(`  p${page}:+${batch.length} `);
    }

    console.log(`→ ${catNew} nuevos`);
  }

  const total = await prisma.food.count({ where: { isActive: true } });
  console.log(`\n✅ Importación completa`);
  console.log(`   Insertados (español)    : ${totalInserted}`);
  console.log(`   Omitidos (sin nombre es): ${totalSkipped}`);
  console.log(`   Total alimentos activos : ${total}`);

  await prisma.$disconnect();
}

void main().catch((e) => {
  console.error(e);
  process.exit(1);
});
