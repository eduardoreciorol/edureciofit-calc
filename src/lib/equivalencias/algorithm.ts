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

// ── Food-type detection for culinary coherence ───────────────────
//
// Each "type" groups foods that can reasonably substitute each other
// within a meal (e.g. all dairy, all meats, all legumes, …).
// When replacing an ingredient in a recipe, the replacement must belong
// to the SAME type (or have an unknown type → permissive fallback).

const FOOD_TYPES: Array<{ type: string; keywords: string[] }> = [
  {
    type: "lacteo",
    keywords: [
      // ES
      "leche", "yogur", "queso", "nata", "mantequill", "kefir", "cuajada",
      "ricotta", "cottage", "mozzarell", "cheddar", "parmesano", "mascarpone",
      "requesón", "skyr", "buttermilk", "ghee",
      // EN
      "milk", "yogurt", "cheese", "cream", "butter", "dairy",
    ],
  },
  {
    type: "carne",
    keywords: [
      // ES
      "pollo", "pechuga", "muslo", "ternera", "buey", "cerdo", "lomo",
      "solomillo", "costilla", "pavo", "conejo", "cordero", "pato", "avestruz",
      "hamburguesa", "carne picada", "filete",
      // EN
      "chicken", "beef", "pork", "turkey", "lamb", "veal", "duck", "rabbit",
      "steak", "ground meat", "minced", "breast", "thigh",
    ],
  },
  {
    type: "pescado_marisco",
    keywords: [
      // ES
      "salmon", "atun", "merluza", "bacalao", "dorada", "lubina", "sardina",
      "caballa", "trucha", "gamba", "langostino", "sepia", "calamar",
      "mejillon", "pulpo", "clupeido", "rape", "panga", "tilapia",
      // EN
      "tuna", "cod", "hake", "shrimp", "prawn", "squid", "mussel",
      "octopus", "trout", "herring", "mackerel", "anchovy", "sea bass",
      "sea bream", "fish",
    ],
  },
  {
    type: "huevo",
    keywords: [
      "huevo", "clara", "yema",
      "egg", "eggs", "egg white", "egg yolk",
    ],
  },
  {
    type: "embutido",
    keywords: [
      // ES
      "jamon", "chorizo", "salchicha", "mortadela", "fiambre", "bacon",
      "panceta", "fuet", "salami", "longaniza", "morcilla",
      // EN
      "ham", "sausage", "pepperoni", "prosciutto",
    ],
  },
  {
    type: "legumbre",
    keywords: [
      // ES
      "lenteja", "garbanzo", "alubia", "judía", "frijol", "hummus",
      "edamame", "guisante", "haba", "soja texturiz",
      // EN
      "lentil", "chickpea", "bean", "legume",
    ],
  },
  {
    type: "proteina_vegetal",
    keywords: [
      "tofu", "tempeh", "seitan",
    ],
  },
  {
    type: "cereal_desayuno",
    keywords: [
      // ES
      "cereal", "copos", "granola", "muesli", "salvado",
      "corn flakes", "special k", "choco", "frosties",
      // EN
      "oat flakes", "breakfast cereal",
    ],
  },
  {
    type: "avena",
    keywords: [
      "avena", "porridge", "overnight oat", "oatmeal",
    ],
  },
  {
    type: "pan_pasta_arroz",
    keywords: [
      // ES
      "arroz", "pasta", "macarron", "espagueti", "fideo", "quinoa",
      "bulgur", "cuscus", "cous cous", "tostada", " pan ", "baguette",
      "tortilla de trigo", "wrap",
      // EN
      "rice", "noodle", "spaghetti", "penne", "fusilli", "bread",
      "couscous", "tortilla", "pita",
    ],
  },
  {
    type: "patata",
    keywords: [
      "patata", "boniato", "yuca", "ñame", "mandioca",
      "potato", "sweet potato",
    ],
  },
  {
    type: "fruta",
    keywords: [
      // ES
      "manzana", "platano", "naranja", "fresa", "kiwi", "mango", "melon",
      "sandia", " uva", "pera", "piña", "arandano", "frambuesa", "ciruela",
      "albaricoque", "cereza", "higo", "datil", "papaya", "maracuya",
      "lichis", "caqui", "granada", "nectarina", "mandarina", "pomelo",
      // EN
      "apple", "banana", "orange", "strawberr", "grape", "peach",
      "watermelon", "blueberr", "raspberr", "cherry", "fig", "date",
      "pineapple", "lemon", "lime",
    ],
  },
  {
    type: "verdura",
    keywords: [
      // ES
      "espinaca", "brocoli", "zanahoria", "tomate", "pepino", "lechuga",
      "acelga", "coliflor", "pimiento", "calabacin", "berenjena", "apio",
      "puerro", "cebolla", "alcachofa", "esparragos", "rabano", "nabo",
      "remolacha", "champiñon", "seta", "endivia", "canonigos",
      // EN
      "spinach", "broccoli", "carrot", "tomato", "cucumber", "lettuce",
      "cauliflower", "pepper", "zucchini", "eggplant", "celery", "onion",
      "mushroom", "asparagus", "beetroot", "cabbage", "kale",
    ],
  },
  {
    type: "frutos_secos_semillas",
    keywords: [
      // ES
      "almendra", " nuez", "anacardo", "pistach", "avellana", "cacahuete",
      "macadamia", "pipa", "tahini", "mantequilla de", "chia", "lino",
      "sesamo", "girasol", "calabaza",
      // EN
      "almond", "walnut", "cashew", "hazelnut", "peanut", "sunflower seed",
      "pumpkin seed", "sesame", "flaxseed",
    ],
  },
  {
    type: "aceite",
    keywords: [
      "aceite de",
      "olive oil", "sunflower oil", "coconut oil",
    ],
  },
  {
    type: "bebida_proteica",
    keywords: [
      "proteina en polvo", "whey", "caseina", "batido proteico",
      "protein powder", "suero de leche en polvo", "protein shake",
    ],
  },
];

/**
 * Returns the culinary type of a food based on keyword matching,
 * or null if it can't be classified (→ no type filtering applied).
 */
function detectFoodType(name: string): string | null {
  const n = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
  for (const { type, keywords } of FOOD_TYPES) {
    if (keywords.some((kw) => n.includes(kw))) return type;
  }
  return null;
}

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

  // Get top 20 alternatives for each food (larger pool = more combinations)
  const rawAlternativasPerFood = await Promise.all(
    recipeItems.map((item) => getEquivalencias(item.foodId, item.quantity, 20))
  );

  // ── Culinary-type pre-filter ──────────────────────────────────
  // For each slot, keep only alternatives whose food type matches the
  // original food's type (e.g. "bacalao" → only other fish, not chicken).
  //
  // Rules:
  //  · original has known type → replacement must ALSO have known type AND match
  //    (unknown-type replacements are rejected to block unclassified meats in English)
  //  · original has unknown type → no restriction (any macro-equivalent allowed)
  //  · fallback: if strict filtering leaves < 2 candidates, relax to allow
  //    unknown-type replacements; if still < 2, use the raw macro pool
  const alternativasPerFood = rawAlternativasPerFood.map((alts, i) => {
    const origType = detectFoodType(originalItems[i]!.food.name);
    if (!origType) return alts; // original unclassifiable → no restriction

    // Strict: same type AND replacement must be classifiable
    const strict = alts.filter((alt) => {
      const altType = detectFoodType(alt.food.name);
      return altType === origType;
    });
    if (strict.length >= 2) return strict;

    // Relax: allow unknown-type replacements (might still be correct food)
    const relaxed = alts.filter((alt) => {
      const altType = detectFoodType(alt.food.name);
      return !altType || altType === origType;
    });
    if (relaxed.length >= 2) return relaxed;

    // Last resort: full macro pool (no type restriction)
    return alts;
  });

  // ── Helper: words used by a set of food names ──────────────────
  function familyWordsOf(names: string[]): Set<string> {
    const s = new Set<string>();
    for (const n of names) nameWords(n).forEach((w) => s.add(w));
    return s;
  }

  // ── Helper: compute totalMacros and diffScore for a candidate set ──
  function buildAlternativa(items: RecipeItemWithFood[]): RecipeAlternativa {
    const totalMacros: Macros = items.reduce(
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

    return {
      id: randomUUID(),
      foods: items,
      totalMacros,
      diffScore: Math.round(
        (diffs.reduce((a, b) => a + b, 0) / diffs.length) * 100
      ),
    };
  }

  const alternativas: RecipeAlternativa[] = [];
  const N = recipeItems.length;

  if (N === 1) {
    // Single food: return top alternatives directly
    const alts = alternativasPerFood[0]!.slice(0, 10);
    for (const alt of alts) {
      alternativas.push(
        buildAlternativa([{ food: alt.food, quantity: alt.quantity, macros: alt.macros }])
      );
    }
    return alternativas;
  }

  // All original family words (used to block all original ingredients from appearing in replacements)
  const allOriginalWords = familyWordsOf(originalItems.map((i) => i.food.name));

  // ── Strategy: for each "anchor" position (the one original food we keep),
  //    greedily pick the best non-conflicting alternative for every other slot.
  //    Rule: an alternative recipe shares AT MOST 1 food with the original.
  //
  //    For extra variety, try top-3 alternatives for the first non-anchor slot
  //    and pick the best result. ────────────────────────────────────────────

  // alternativasByAnchor[anchorIdx] = alternatives that keep food[anchorIdx]
  const alternativasByAnchor: RecipeAlternativa[][] = Array.from({ length: N }, () => []);

  for (let anchorIdx = 0; anchorIdx < N; anchorIdx++) {
    const anchorItem = originalItems[anchorIdx]!;
    const takenWords = familyWordsOf([anchorItem.food.name]);
    const forbiddenWords = new Set([...allOriginalWords]);

    function buildCombo(
      slotOrder: number[],
      slotIdx: number,
      usedWords: Set<string>,
      chosen: Map<number, RecipeItemWithFood>
    ): void {
      if (slotIdx === slotOrder.length) {
        const items: RecipeItemWithFood[] = originalItems.map((orig, pos) => {
          if (pos === anchorIdx) return orig;
          return chosen.get(pos)!;
        });
        alternativasByAnchor[anchorIdx]!.push(buildAlternativa(items));
        return;
      }

      const pos = slotOrder[slotIdx]!;
      const candidates = alternativasPerFood[pos]!;

      let picked = 0;
      for (const alt of candidates) {
        if (picked >= 3) break;
        const words = nameWords(alt.food.name);
        const conflicts =
          words.some((w) => usedWords.has(w)) ||
          words.some((w) => forbiddenWords.has(w));
        if (conflicts) continue;

        const newUsed = new Set([...usedWords, ...words]);
        chosen.set(pos, { food: alt.food, quantity: alt.quantity, macros: alt.macros });
        buildCombo(slotOrder, slotIdx + 1, newUsed, chosen);
        chosen.delete(pos);
        picked++;
      }
    }

    const nonAnchorSlots = Array.from({ length: N }, (_, i) => i).filter(
      (i) => i !== anchorIdx
    );
    buildCombo(nonAnchorSlots, 0, takenWords, new Map());

    // Sort each anchor's alternatives by diffScore
    alternativasByAnchor[anchorIdx]!.sort((a, b) => a.diffScore - b.diffScore);
  }

  // ── Balanced interleaving ────────────────────────────────────────
  // Pick alternatives round-robin across anchors so no single anchor
  // dominates the final list (prevents arroz basmati in 8/10 results).
  const seen = new Set<string>();
  const result: RecipeAlternativa[] = [];
  const TARGET = 10;
  const perAnchorMax = Math.ceil(TARGET / N); // fair quota per anchor

  // Round-robin: take the best from each anchor in turn
  for (let round = 0; round < perAnchorMax && result.length < TARGET; round++) {
    for (let anchorIdx = 0; anchorIdx < N && result.length < TARGET; anchorIdx++) {
      const alt = alternativasByAnchor[anchorIdx]![round];
      if (!alt) continue;

      const key = alt.foods.map((f) => f.food.id).sort().join("|");
      if (seen.has(key)) continue;
      seen.add(key);
      result.push(alt);
    }
  }

  return result;
}
