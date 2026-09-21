import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

const schema = z.object({
  name: z.string().min(1).max(100),
  harbizEmail: z.string().email(),
});

export async function POST(request: Request) {
  const body = await request.json() as unknown;
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const { name, harbizEmail } = parsed.data;
  const admin = getSupabaseAdminClient();

  // Generate a magic link — creates the Supabase auth user if it doesn't exist yet
  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: harbizEmail,
  });

  if (linkError || !linkData) {
    console.error("generateLink error:", linkError);
    return NextResponse.json({ error: "No se pudo generar el acceso" }, { status: 500 });
  }

  const authUserId = linkData.user.id;

  // Upsert user in our users table
  await prisma.user.upsert({
    where: { id: authUserId },
    create: {
      id: authUserId,
      email: harbizEmail,
      name,
      harbizEmail,
    },
    update: {
      name,
      harbizEmail,
    },
  });

  return NextResponse.json({
    token_hash: linkData.properties.hashed_token,
  });
}
