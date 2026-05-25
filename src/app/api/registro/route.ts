import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

const schema = z.object({
  code: z.string().min(1),
  email: z.string().email("Email no válido"),
  name: z.string().min(1, "Nombre requerido").max(80),
  password: z.string().min(8, "Mínimo 8 caracteres"),
});

export async function POST(request: Request) {
  const body = await request.json() as unknown;
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { code, email, name, password } = parsed.data;

  // Validate registration code
  const validCode = process.env.REGISTER_CODE;
  if (!validCode || code !== validCode) {
    return NextResponse.json({ error: "Código de acceso incorrecto" }, { status: 403 });
  }

  // Check if email already registered
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "Este email ya tiene una cuenta. Ve al login." },
      { status: 409 }
    );
  }

  const supabaseAdmin = getSupabaseAdminClient();

  // Create Supabase Auth user (email pre-confirmed — no verification email needed)
  const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError ?? !authUser.user) {
    return NextResponse.json(
      { error: authError?.message ?? "Error creando cuenta" },
      { status: 400 }
    );
  }

  // Create user record in DB
  await prisma.user.create({
    data: {
      id: authUser.user.id,
      email,
      name,
      role: "client",
      isActive: true,
    },
  });

  return NextResponse.json({ success: true, email });
}
