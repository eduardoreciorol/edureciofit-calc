import { prisma } from "@/lib/prisma";
import type {
  DominantMacro,
  EquivalenciaResult,
  Macros,
  RecipeAlternativa,
  RecipeItem,
  RecipeItemWithFood,
} from "@/types";
import { randomUUID } from "crypto";

// ── Dominant macro calculation ───────────────────────────────────

export function calcDominantMacro(
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

  // Dual dominance: both macros >25% and diff <20pp
  if (pPct > 0.25 && fPct > 0.25 && Math.abs(pPct - fPct) < 0.2)
    return "protein_fat";
  if (pPct > 0.25 && cPct > 0.25 && Math.abs(pPct - cPct) < 0.2)
    return "protein_carbs";

  // Single dominant
  if (cPct >= pPct && cPct >= fPct) return "carbs";
  if (pPct >= cPct && pPct >= fPct) return "protein";
  return "fat";
}

// ── Primary macro value for equivalence calculation ──────────────

function getPrimaryMacroValue(
  proteinPer100: number,
  carbsPer100: number,
  fatPer100: number,
  dominantMacro: DominantMacro
): number {
  switch (dominantMacro) {
    case "protein":
    case "protein_fat":
    case "protein_carbs":
      return proteinPer100;
    case "carbs":
      return carbsPer100;
    case "fat":
      return fatPer100;
  }
}

function getPrimaryMacroTarget(
  targetMacros: Macros,
  dominantMacro: DominantMacro
): number {
  switch (dominantMacro) {
    case "protein":
    case "protein_fat":
    case "protein_carbs":
      return targetMacros.protein;
    case "carbs":
      return targetMacros.carbs;
    case "fat":
      return targetMacros.fat;
  }
}

// ── Match score (0-100) based on secondary macros similarity ────

function calcMatchScore(
  target: Macros,
  result: Macros,
  dominantMacro: DominantMacro
): number {
  // Score secondary macros (the ones that aren't the basis of equivalence)
  const secondaryErrors: number[] = [];

  const addError = (t: number, r: number) => {
    if (t === 0 && r === 0) return;
    const err = t === 0 ? 1 : Math.abs(t - r) / t;
    secondaryErrors.push(Math.min(err, 1));
  };

  if (dominantMacro !== "protein") addError(target.protein, result.protein);
  if (dominantMacro !== "carbs") addError(target.carbs, result.carbs);
  if (dominantMacro !== "fat") addError(target.fat, result.fat);

  if (secondaryErrors.length === 0) return 100;
  const avgError =
    secondaryErrors.reduce((a, b) => a + b, 0) / secondaryErrors.length;
  return Math.round((1 - avgError) * 100);
}

// ── Name similarity filter ───────────────────────────────────────

/**
 * Normalizes a food name to a list of significant words (length > 3,
 * accents removed, lowercase) to detect same-family foods.
 * e.g. "Arroz integral" → ["arroz", "integral"]
 */
function nameWords(name: string): string[] {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3);
}

/**
 * Returns true if the candidate food shares a significant keyword
 * with the source food — meaning they are the same family and the
 * candidate should be excluded from results.
 * e.g. source="Arroz blanco", candidate="Arroz integral" → true
 */
function isSameFamily(sourceName: string, candidateName: string): boolean {
  const sourceWords = nameWords(sourceName);
  if (sourceWords.length === 0) return false;
  const candidateWords = new Set(nameWords(candidateName));
  return sourceWords.some((w) => candidateWords.has(w));
}

// ── Main equivalence function ────────────────────────────────────

export async function getEquivalencias(
  foodId: string,
  quantityGrams: number,
  limit = 20
): Promise<EquivalenciaResult[]> {
  const food = await prisma.food.findUnique({ where: { id: foodId } });
  if (!food) throw new Error("Alimento no encontrado");

  const factor = quantityGrams / 100;
  const targetMacros: Macros = {
    protein: food.protein.toNumber() * factor,
    carbs: food.carbs.toNumber() * factor,
    fat: food.fat.toNumber() * factor,
    calories: food.calories.toNumber() * factor,
  };

  const candidates = await prisma.food.findMany({
    where: {
      dominantMacro: food.dominantMacro,
      isActive: true,
      id: { not: foodId },
    },
    take: 500,
  });

  // Exclude foods from the same family (same keyword in name)
  // e.g. searching "Arroz blanco" excludes "Arroz integral", "Arroz basmati"…
  const filtered = candidates.filter((c) => !isSameFamily(food.name, c.name));

  const results: EquivalenciaResult[] = filtered
    .map((candidate) => {
      const primaryPer100 = getPrimaryMacroValue(
        candidate.protein.toNumber(),
        candidate.carbs.toNumber(),
        candidate.fat.toNumber(),
        food.dominantMacro
      );

      if (primaryPer100 === 0) return null;

      const targetPrimary = getPrimaryMacroTarget(
        targetMacros,
        food.dominantMacro
      );
      const equivalentGrams = (targetPrimary / primaryPer100) * 100;

      if (equivalentGrams <= 0 || equivalentGrams > 2000) return null;

      const eqFactor = equivalentGrams / 100;
      const resultMacros: Macros = {
        protein: candidate.protein.toNumber() * eqFactor,
        carbs: candidate.carbs.toNumber() * eqFactor,
        fat: candidate.fat.toNumber() * eqFactor,
        calories: candidate.calories.toNumber() * eqFactor,
      };

      const matchScore = calcMatchScore(targetMacros, resultMacros, food.dominantMacro);

      return {
        food: {
          id: candidate.id,
          name: candidate.name,
          brand: candidate.brand,
          category: candidate.category,
          calories: candidate.calories.toNumber(),
          protein: candidate.protein.toNumber(),
          carbs: candidate.carbs.toNumber(),
          fat: candidate.fat.toNumber(),
          fiber: candidate.fiber?.toNumber() ?? null,
          dominantMacro: candidate.dominantMacro,
          source: candidate.source,
          offId: candidate.offId,
          isActive: candidate.isActive,
          createdById: candidate.createdById,
          createdAt: candidate.createdAt,
          updatedAt: candidate.updatedAt,
        },
        quantity: Math.round(equivalentGrams),
        macros: resultMacros,
        matchScore,
      } satisfies EquivalenciaResult;
    })
    .filter((r): r is EquivalenciaResult => r !== null);

  return results.sort((a, b) => b.matchScore - a.matchScore).slice(0, limit);
}

// ── Recipe swap ──────────────────────────────────────────────────

export async function getRecipeAlternativas(
  recipeItems: RecipeItem[]
): Promise<RecipeAlternativa[]> {
  if (recipeItems.length === 0) return [];

  const foods = await prisma.food.findMany({
    where: { id: { in: recipeItems.map((i) => i.foodId) } },
  });

  const foodMap = new Map(foods.map((f) => [f.id, f]));

  // Build original recipe items with macros
  const originalItems: RecipeItemWithFood[] = recipeItems.map((item) => {
    const food = foodMap.get(item.foodId);
    if (!food) throw new Error(`Alimento no encontrado: ${item.foodId}`);
    const factor = item.quantity / 100;
    return {
      food: {
        id: food.id,
        name: food.name,
        brand: food.brand,
        category: food.category,
        calories: food.calories.toNumber(),
        protein: food.protein.toNumber(),
        carbs: food.carbs.toNumber(),
        fat: food.fat.toNumber(),
        fiber: food.fiber?.toNumber() ?? null,
        dominantMacro: food.dominantMacro,
        source: food.source,
        offId: food.offId,
        isActive: food.isActive,
        createdById: food.createdById,
        createdAt: food.createdAt,
        updatedAt: food.updatedAt,
      },
      quantity: item.quantity,
      macros: {
        protein: food.protein.toNumber() * factor,
        carbs: food.carbs.toNumber() * factor,
        fat: food.fat.toNumber() * factor,
        calories: food.calories.toNumber() * factor,
      },
    };
  });

  // Get top 3 alternatives for each food item
  const alternativasPerFood = await Promise.all(
    recipeItems.map((item) => getEquivalencias(item.foodId, item.quantity, 3))
  );

  // Generate alternatives by substituting one food at a time
  const alternativas: RecipeAlternativa[] = [];

  for (let i = 0; i < recipeItems.length; i++) {
    const alts = alternativasPerFood[i];
    for (const alt of alts) {
      const newItems: RecipeItemWithFood[] = originalItems.map((orig, idx) => {
        if (idx !== i) return orig;
        return {
          food: alt.food,
          quantity: alt.quantity,
          macros: alt.macros,
        };
      });

      const totalMacros: Macros = newItems.reduce(
        (acc, item) => ({
          protein: acc.protein + item.macros.protein,
          carbs: acc.carbs + item.macros.carbs,
          fat: acc.fat + item.macros.fat,
          calories: acc.calories + item.macros.calories,
        }),
        { protein: 0, carbs: 0, fat: 0, calories: 0 }
      );

      const originalTotal: Macros = originalItems.reduce(
        (acc, item) => ({
          protein: acc.protein + item.macros.protein,
          carbs: acc.carbs + item.macros.carbs,
          fat: acc.fat + item.macros.fat,
          calories: acc.calories + item.macros.calories,
        }),
        { protein: 0, carbs: 0, fat: 0, calories: 0 }
      );

      // diffScore: average % difference across all macros
      const diffs = [
        originalTotal.protein > 0
          ? Math.abs(totalMacros.protein - originalTotal.protein) / originalTotal.protein
          : 0,
        originalTotal.carbs > 0
          ? Math.abs(totalMacros.carbs - originalTotal.carbs) / originalTotal.carbs
          : 0,
        originalTotal.fat > 0
          ? Math.abs(totalMacros.fat - originalTotal.fat) / originalTotal.fat
          : 0,
      ];
      const diffScore = Math.round(
        (diffs.reduce((a, b) => a + b, 0) / diffs.length) * 100
      );

      alternativas.push({
        id: randomUUID(),
        foods: newItems,
        totalMacros,
        diffScore,
      });
    }
  }

  return alternativas.sort((a, b) => a.diffScore - b.diffScore).slice(0, 5);
}
