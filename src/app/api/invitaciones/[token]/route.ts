import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

const registerSchema = z.object({
  name: z.string().min(1, "Nombre requerido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
});

// GET — validate token
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const invitation = await prisma.invitation.findUnique({ where: { token } });

  if (!invitation) {
    return NextResponse.json({ error: "Invitación no válida" }, { status: 404 });
  }
  if (invitation.usedAt) {
    return NextResponse.json({ error: "Esta invitación ya ha sido usada" }, { status: 410 });
  }
  if (new Date() > invitation.expiresAt) {
    return NextResponse.json({ error: "Esta invitación ha expirado" }, { status: 410 });
  }

  return NextResponse.json({
    email: invitation.email,
    expires_at: invitation.expiresAt,
  });
}

// POST — register user with token
export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const invitation = await prisma.invitation.findUnique({ where: { token } });
  if (!invitation) {
    return NextResponse.json({ error: "Invitación no válida" }, { status: 404 });
  }
  if (invitation.usedAt) {
    return NextResponse.json({ error: "Esta invitación ya ha sido usada" }, { status: 410 });
  }
  if (new Date() > invitation.expiresAt) {
    return NextResponse.json({ error: "Esta invitación ha expirado" }, { status: 410 });
  }

  const body = await request.json() as unknown;
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { name, password } = parsed.data;
  const supabaseAdmin = getSupabaseAdminClient();

  // Create Supabase Auth user
  const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: invitation.email,
    password,
    email_confirm: true,
  });

  if (authError || !authUser.user) {
    return NextResponse.json(
      { error: authError?.message ?? "Error creando cuenta" },
      { status: 400 }
    );
  }

  // Create user record in DB
  await prisma.user.create({
    data: {
      id: authUser.user.id,
      email: invitation.email,
      name,
      role: "client",
      isActive: true,
      invitedById: invitation.invitedById,
    },
  });

  // Mark invitation as used
  await prisma.invitation.update({
    where: { token },
    data: { usedAt: new Date() },
  });

  return NextResponse.json({ success: true, email: invitation.email });
}
