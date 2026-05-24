/**
 * Crea el usuario admin en Supabase Auth + tabla users
 * Ejecutar: DATABASE_URL=... pnpm dlx tsx scripts/create-admin.ts
 */
import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "eduardo.recio.rol@gmail.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "EduAdmin2026!";
const ADMIN_NAME = "Eduardo Recio";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log(`🔑 Creando usuario admin: ${ADMIN_EMAIL}`);

  // 1 — Crear en Supabase Auth
  const { data, error } = await supabase.auth.admin.createUser({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    email_confirm: true,
  });

  if (error && !error.message.includes("already been registered")) {
    throw new Error(`Auth error: ${error.message}`);
  }

  const userId = data?.user?.id;

  if (!userId) {
    // User may already exist — look it up
    const { data: list } = await supabase.auth.admin.listUsers();
    const existing = list?.users?.find((u) => u.email === ADMIN_EMAIL);
    if (!existing) throw new Error("No se pudo obtener el userId del admin");
    console.log(`ℹ️  Usuario ya existía en Auth: ${existing.id}`);

    await prisma.user.upsert({
      where: { email: ADMIN_EMAIL },
      update: { role: "admin", isActive: true, name: ADMIN_NAME },
      create: { id: existing.id, email: ADMIN_EMAIL, name: ADMIN_NAME, role: "admin", isActive: true },
    });
  } else {
    console.log(`✅ Auth user creado: ${userId}`);
    await prisma.user.upsert({
      where: { email: ADMIN_EMAIL },
      update: { role: "admin", isActive: true, name: ADMIN_NAME },
      create: { id: userId, email: ADMIN_EMAIL, name: ADMIN_NAME, role: "admin", isActive: true },
    });
  }

  console.log("✅ Admin listo en tabla users");
  console.log(`📧 Email: ${ADMIN_EMAIL}`);
  console.log(`🔐 Password: ${ADMIN_PASSWORD}`);
  await prisma.$disconnect();
}

void main().catch((e) => { console.error(e); process.exit(1); });
