import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { sendInvitationEmail } from "@/lib/email/resend";
import { z } from "zod";
import { randomUUID } from "crypto";

const schema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
});

export async function POST(request: Request) {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  // Verify admin role
  const { data: adminUser } = await supabase
    .from("users")
    .select("role, is_active")
    .eq("id", user.id)
    .single();

  if (!adminUser || adminUser.role !== "admin" || !adminUser.is_active) {
    return NextResponse.json({ error: "Solo administradores" }, { status: 403 });
  }

  const body = await request.json() as unknown;
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { email, name } = parsed.data;

  // Check for existing active user
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing?.isActive) {
    return NextResponse.json(
      { error: "Este email ya tiene una cuenta activa" },
      { status: 409 }
    );
  }

  const token = randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const invitation = await prisma.invitation.create({
    data: {
      token,
      email,
      invitedById: user.id,
      expiresAt,
    },
  });

  // Send email (don't block on failure)
  try {
    await sendInvitationEmail({ to: email, name, token });
  } catch (err) {
    console.error("Error sending invitation email:", err);
    // Still return success — invitation is created, can resend manually
  }

  return NextResponse.json(
    {
      id: invitation.id,
      email: invitation.email,
      token: invitation.token,
      expires_at: invitation.expiresAt,
    },
    { status: 201 }
  );
}

export async function GET(request: Request) {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { data: adminUser } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!adminUser || adminUser.role !== "admin") {
    return NextResponse.json({ error: "Solo administradores" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const limit = 20;

  const [invitations, total] = await Promise.all([
    prisma.invitation.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: { invitedBy: { select: { name: true, email: true } } },
    }),
    prisma.invitation.count(),
  ]);

  return NextResponse.json({ invitations, total, page, limit });
}
