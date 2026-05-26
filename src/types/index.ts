// ── Domain types ─────────────────────────────────────────────────

export type UserRole = "client" | "admin";

export type DominantMacro =
  | "protein"
  | "carbs"
  | "fat"
  | "protein_fat"
  | "protein_carbs";

export type FoodSource = "openfoodfacts" | "custom" | "harbiz";

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  isActive: boolean;
  invitedById: string | null;
  createdAt: Date;
}

export interface Invitation {
  id: string;
  token: string;
  email: string;
  invitedById: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
}

export interface Food {
  id: string;
  name: string;
  brand: string | null;
  category: string | null;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number | null;
  dominantMacro: DominantMacro;
  source: FoodSource;
  offId: string | null;
  isActive: boolean;
  createdById: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Macros {
  protein: number;
  carbs: number;
  fat: number;
  calories: number;
}

export interface EquivalenciaResult {
  food: Food;
  quantity: number;
  macros: Macros;
  matchScore: number;
}

export interface RecipeItem {
  foodId: string;
  quantity: number;
}

export interface RecipeItemWithFood {
  food: Food;
  quantity: number;
  macros: Macros;
}

export interface RecipeAlternativa {
  id: string;
  foods: RecipeItemWithFood[];
  totalMacros: Macros;
  diffScore: number;
}
