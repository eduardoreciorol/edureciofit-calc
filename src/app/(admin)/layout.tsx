import Link from "next/link";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

async function AdminNav() {
  return (
    <nav className="sticky top-0 z-40 bg-[#18181B] border-b border-[#27272A] px-4 h-14 flex items-center gap-6">
      <span className="text-[#3B82F6] font-bold text-sm">edu admin</span>
      <div className="flex gap-4 text-sm">
        <Link href="/admin" className="text-[#A1A1AA] hover:text-[#FAFAFA] transition-colors">
          Dashboard
        </Link>
        <Link href="/admin/usuarios" className="text-[#A1A1AA] hover:text-[#FAFAFA] transition-colors">
          Usuarios
        </Link>
        <Link href="/admin/alimentos" className="text-[#A1A1AA] hover:text-[#FAFAFA] transition-colors">
          Alimentos
        </Link>
      </div>
      <div className="ml-auto">
        <Link href="/swap" className="text-xs text-[#A1A1AA] hover:text-[#3B82F6]">
          ← App
        </Link>
      </div>
    </nav>
  );
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true, isActive: true },
  });

  if (!dbUser || dbUser.role !== "admin" || !dbUser.isActive) {
    redirect("/swap");
  }

  return (
    <div className="min-h-screen bg-[#09090B]">
      <AdminNav />
      <main className="max-w-4xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
