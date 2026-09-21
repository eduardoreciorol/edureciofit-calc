import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");

  if (!key || key !== process.env.FOODS_REVIEW_SECRET) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const since = new Date();
  since.setDate(since.getDate() - 7);

  const foods = await prisma.food.findMany({
    where: {
      source: "custom",
      createdAt: { gte: since },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      brand: true,
      calories: true,
      protein: true,
      carbs: true,
      fat: true,
      fiber: true,
      dominantMacro: true,
      isActive: true,
      createdAt: true,
    },
  });

  const report = {
    period: `${since.toISOString().split("T")[0]} → ${new Date().toISOString().split("T")[0]}`,
    total: foods.length,
    foods: foods.map((f) => ({
      name: f.name,
      brand: f.brand ?? "—",
      kcal: Number(f.calories),
      prot: Number(f.protein),
      carbs: Number(f.carbs),
      fat: Number(f.fat),
      fiber: f.fiber ? Number(f.fiber) : null,
      macro: f.dominantMacro,
      active: f.isActive,
      added: f.createdAt.toISOString().split("T")[0],
    })),
  };

  return NextResponse.json(report);
}
