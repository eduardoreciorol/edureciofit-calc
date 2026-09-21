import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");

  if (!key || key !== process.env.FOODS_REVIEW_SECRET) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const results: string[] = [];

  try {
    await prisma.$executeRawUnsafe('DROP TABLE IF EXISTS "diary_logs" CASCADE;');
    results.push("✓ DROP TABLE diary_logs");
  } catch (e) {
    results.push(`✗ DROP TABLE: ${e instanceof Error ? e.message : String(e)}`);
  }

  try {
    await prisma.$executeRawUnsafe('DROP TYPE IF EXISTS "MealSlot" CASCADE;');
    results.push("✓ DROP TYPE MealSlot");
  } catch (e) {
    results.push(`✗ DROP TYPE: ${e instanceof Error ? e.message : String(e)}`);
  }

  return NextResponse.json({ results });
}
