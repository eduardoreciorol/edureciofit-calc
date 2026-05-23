import { prisma } from "@/lib/prisma";

export default async function AdminDashboard() {
  const [totalUsers, activeUsers, totalFoods, pendingInvitations] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.food.count({ where: { isActive: true } }),
      prisma.invitation.count({
        where: {
          usedAt: null,
          expiresAt: { gt: new Date() },
        },
      }),
    ]);

  const stats = [
    { label: "Usuarios activos", value: activeUsers, sub: `${totalUsers} total`, color: "#22C55E" },
    { label: "Alimentos en DB", value: totalFoods.toLocaleString("es-ES"), color: "#3B82F6" },
    { label: "Invitaciones pendientes", value: pendingInvitations, color: "#F59E0B" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-[#FAFAFA]">Dashboard</h1>
        <p className="text-sm text-[#A1A1AA] mt-1">Panel de administración de edureciofit</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-[#18181B] border border-[#27272A] rounded-[12px] p-5"
          >
            <p className="text-xs text-[#A1A1AA] uppercase tracking-wide font-medium mb-2">
              {stat.label}
            </p>
            <p className="text-3xl font-extrabold" style={{ color: stat.color }}>
              {stat.value}
            </p>
            {stat.sub && (
              <p className="text-xs text-[#71717A] mt-1">{stat.sub}</p>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <a
          href="/admin/usuarios"
          className="bg-[#18181B] border border-[#27272A] rounded-[12px] p-5 hover:border-[#3B82F6] transition-colors block"
        >
          <p className="font-semibold text-[#FAFAFA] mb-1">Gestión de usuarios</p>
          <p className="text-sm text-[#A1A1AA]">
            Invitar clientes, revocar accesos, ver historial
          </p>
        </a>
        <a
          href="/admin/alimentos"
          className="bg-[#18181B] border border-[#27272A] rounded-[12px] p-5 hover:border-[#3B82F6] transition-colors block"
        >
          <p className="font-semibold text-[#FAFAFA] mb-1">Base de alimentos</p>
          <p className="text-sm text-[#A1A1AA]">
            Buscar, editar y crear alimentos custom
          </p>
        </a>
      </div>
    </div>
  );
}
