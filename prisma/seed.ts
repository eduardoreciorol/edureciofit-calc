/**
 * Seed script — alimentos básicos para desarrollo
 * Ejecutar: npx tsx prisma/seed.ts
 *
 * ⚠️ Solo para desarrollo. En producción, usar el import de OpenFoodFacts.
 */

import { PrismaClient, DominantMacro } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const connectionString = process.env.DATABASE_URL ?? "";
const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });

type SeedFood = {
  name: string;
  brand?: string;
  category: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
};

// Macro dominante por porcentaje de calorías
function calcDominantMacro(protein: number, carbs: number, fat: number) {
  const pCal = protein * 4;
  const cCal = carbs * 4;
  const fCal = fat * 9;
  const total = pCal + cCal + fCal;
  if (total === 0) return "carbs";
  const pPct = pCal / total;
  const cPct = cCal / total;
  const fPct = fCal / total;
  if (pPct > 0.25 && fPct > 0.25 && Math.abs(pPct - fPct) < 0.2) return "protein_fat";
  if (pPct > 0.25 && cPct > 0.25 && Math.abs(pPct - cPct) < 0.2) return "protein_carbs";
  if (cPct >= pPct && cPct >= fPct) return "carbs";
  if (pPct >= cPct && pPct >= fPct) return "protein";
  return "fat";
}

const foods: SeedFood[] = [
  // ── Cereales / Hidratos ──────────────────────────────────────
  { name: "Arroz blanco cocido", category: "cereales", calories: 130, protein: 2.7, carbs: 28.2, fat: 0.3, fiber: 0.4 },
  { name: "Arroz integral cocido", category: "cereales", calories: 111, protein: 2.6, carbs: 23.0, fat: 0.9, fiber: 1.8 },
  { name: "Pasta cocida (espaguetis)", category: "cereales", calories: 158, protein: 5.8, carbs: 30.9, fat: 0.9, fiber: 1.8 },
  { name: "Pan blanco de trigo", category: "cereales", calories: 265, protein: 8.9, carbs: 49.4, fat: 3.2, fiber: 2.7 },
  { name: "Pan integral", category: "cereales", calories: 247, protein: 10.7, carbs: 41.3, fat: 3.5, fiber: 6.8 },
  { name: "Patata cocida", category: "tubérculos", calories: 87, protein: 1.9, carbs: 20.1, fat: 0.1, fiber: 1.8 },
  { name: "Batata cocida", category: "tubérculos", calories: 90, protein: 2.0, carbs: 20.7, fat: 0.1, fiber: 3.0 },
  { name: "Avena en copos", category: "cereales", calories: 366, protein: 12.5, carbs: 55.7, fat: 7.1, fiber: 9.7 },
  { name: "Couscous cocido", category: "cereales", calories: 112, protein: 3.8, carbs: 23.2, fat: 0.2, fiber: 1.4 },
  { name: "Quinoa cocida", category: "cereales", calories: 120, protein: 4.4, carbs: 21.3, fat: 1.9, fiber: 2.8 },
  { name: "Maíz cocido", category: "cereales", calories: 96, protein: 3.4, carbs: 21.0, fat: 1.5, fiber: 2.4 },
  { name: "Lentejas cocidas", category: "legumbres", calories: 116, protein: 9.0, carbs: 20.1, fat: 0.4, fiber: 7.9 },
  { name: "Garbanzos cocidos", category: "legumbres", calories: 164, protein: 8.9, carbs: 27.4, fat: 2.6, fiber: 7.6 },
  { name: "Judías blancas cocidas", category: "legumbres", calories: 139, protein: 9.7, carbs: 25.1, fat: 0.5, fiber: 6.3 },
  { name: "Edamame", category: "legumbres", calories: 121, protein: 11.9, carbs: 8.9, fat: 5.2, fiber: 5.2 },

  // ── Proteínas ────────────────────────────────────────────────
  { name: "Pechuga de pollo a la plancha", category: "carnes", calories: 165, protein: 31.0, carbs: 0.0, fat: 3.6 },
  { name: "Muslo de pollo sin piel cocido", category: "carnes", calories: 177, protein: 24.8, carbs: 0.0, fat: 8.4 },
  { name: "Ternera (filete magro)", category: "carnes", calories: 158, protein: 26.7, carbs: 0.0, fat: 5.3 },
  { name: "Cerdo (lomo)", category: "carnes", calories: 182, protein: 28.4, carbs: 0.0, fat: 7.0 },
  { name: "Salmón al horno", category: "pescados", calories: 206, protein: 20.4, carbs: 0.0, fat: 13.4 },
  { name: "Merluza al vapor", category: "pescados", calories: 86, protein: 17.5, carbs: 0.0, fat: 1.2 },
  { name: "Atún en agua (lata)", category: "pescados", calories: 116, protein: 25.5, carbs: 0.0, fat: 1.0 },
  { name: "Atún en aceite (lata, escurrido)", category: "pescados", calories: 198, protein: 29.1, carbs: 0.0, fat: 9.0 },
  { name: "Sardinas en conserva", category: "pescados", calories: 208, protein: 24.6, carbs: 0.0, fat: 11.5 },
  { name: "Gambas cocidas", category: "pescados", calories: 99, protein: 20.9, carbs: 0.2, fat: 1.5 },
  { name: "Huevo entero (L)", category: "huevos", calories: 143, protein: 12.6, carbs: 0.7, fat: 9.5 },
  { name: "Clara de huevo", category: "huevos", calories: 52, protein: 10.9, carbs: 0.7, fat: 0.2 },
  { name: "Tofu firme", category: "proteínas vegetales", calories: 76, protein: 8.1, carbs: 1.9, fat: 4.2 },
  { name: "Tempeh", category: "proteínas vegetales", calories: 193, protein: 19.0, carbs: 9.4, fat: 10.8 },

  // ── Lácteos ──────────────────────────────────────────────────
  { name: "Leche entera", category: "lácteos", calories: 61, protein: 3.2, carbs: 4.8, fat: 3.3 },
  { name: "Leche desnatada", category: "lácteos", calories: 34, protein: 3.4, carbs: 4.9, fat: 0.1 },
  { name: "Yogur natural entero", category: "lácteos", calories: 61, protein: 3.5, carbs: 4.7, fat: 3.3 },
  { name: "Yogur natural desnatado", category: "lácteos", calories: 40, protein: 4.0, carbs: 5.2, fat: 0.2 },
  { name: "Yogur griego (0% grasa)", category: "lácteos", calories: 67, protein: 10.3, carbs: 3.6, fat: 0.4 },
  { name: "Queso fresco 0%", category: "lácteos", calories: 49, protein: 7.6, carbs: 2.5, fat: 0.8 },
  { name: "Queso cottage", category: "lácteos", calories: 98, protein: 11.1, carbs: 3.4, fat: 4.3 },
  { name: "Requesón", category: "lácteos", calories: 74, protein: 11.5, carbs: 3.4, fat: 1.5 },
  { name: "Queso mozzarella light", category: "lácteos", calories: 177, protein: 20.5, carbs: 0.0, fat: 10.5 },

  // ── Grasas ───────────────────────────────────────────────────
  { name: "Aceite de oliva virgen extra", category: "grasas", calories: 884, protein: 0.0, carbs: 0.0, fat: 100.0 },
  { name: "Aguacate", category: "frutas", calories: 160, protein: 2.0, carbs: 8.5, fat: 14.7, fiber: 6.7 },
  { name: "Almendras", category: "frutos secos", calories: 576, protein: 21.2, carbs: 21.7, fat: 49.9, fiber: 12.5 },
  { name: "Nueces", category: "frutos secos", calories: 654, protein: 15.2, carbs: 13.7, fat: 65.2, fiber: 6.7 },
  { name: "Mantequilla de cacahuete", category: "grasas", calories: 588, protein: 25.1, carbs: 20.1, fat: 49.9, fiber: 6.0 },

  // ── Verduras ─────────────────────────────────────────────────
  { name: "Brócoli cocido", category: "verduras", calories: 35, protein: 2.4, carbs: 7.2, fat: 0.4, fiber: 3.3 },
  { name: "Espinacas crudas", category: "verduras", calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4, fiber: 2.2 },
  { name: "Tomate crudo", category: "verduras", calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2, fiber: 1.2 },
  { name: "Pimiento rojo crudo", category: "verduras", calories: 31, protein: 1.0, carbs: 6.0, fat: 0.3, fiber: 2.1 },
  { name: "Zanahoria cruda", category: "verduras", calories: 41, protein: 0.9, carbs: 9.6, fat: 0.2, fiber: 2.8 },
  { name: "Pepino crudo", category: "verduras", calories: 16, protein: 0.7, carbs: 3.6, fat: 0.1, fiber: 0.5 },
  { name: "Lechuga romana", category: "verduras", calories: 17, protein: 1.2, carbs: 3.3, fat: 0.3, fiber: 2.1 },
  { name: "Calabacín cocido", category: "verduras", calories: 17, protein: 1.1, carbs: 3.6, fat: 0.2, fiber: 1.0 },

  // ── Frutas ───────────────────────────────────────────────────
  { name: "Plátano", category: "frutas", calories: 89, protein: 1.1, carbs: 23.0, fat: 0.3, fiber: 2.6 },
  { name: "Manzana", category: "frutas", calories: 52, protein: 0.3, carbs: 13.8, fat: 0.2, fiber: 2.4 },
  { name: "Naranja", category: "frutas", calories: 47, protein: 0.9, carbs: 11.8, fat: 0.1, fiber: 2.4 },
  { name: "Fresas", category: "frutas", calories: 32, protein: 0.7, carbs: 7.7, fat: 0.3, fiber: 2.0 },
  { name: "Arándanos", category: "frutas", calories: 57, protein: 0.7, carbs: 14.5, fat: 0.3, fiber: 2.4 },
  { name: "Mango", category: "frutas", calories: 60, protein: 0.8, carbs: 15.0, fat: 0.4, fiber: 1.6 },

  // ── Suplementos / Proteína ───────────────────────────────────
  { name: "Proteína whey (polvo)", category: "suplementos", calories: 373, protein: 74.0, carbs: 8.0, fat: 4.0 },
  { name: "Proteína vegana (polvo)", category: "suplementos", calories: 350, protein: 70.0, carbs: 10.0, fat: 3.0 },
];

async function main() {
  console.log("🌱 Seeding alimentos básicos...");

  const data = foods.map((f) => ({
    name: f.name,
    brand: f.brand ?? null,
    category: f.category,
    calories: f.calories,
    protein: f.protein,
    carbs: f.carbs,
    fat: f.fat,
    fiber: f.fiber ?? null,
    dominantMacro: calcDominantMacro(f.protein, f.carbs, f.fat) as DominantMacro,
    source: "custom" as const,
    isActive: true,
  }));

  const result = await prisma.food.createMany({
    data,
    skipDuplicates: true,
  });

  console.log(`✅ Insertados ${result.count} alimentos`);
  await prisma.$disconnect();
}

void main().catch((e) => {
  console.error(e);
  process.exit(1);
});
