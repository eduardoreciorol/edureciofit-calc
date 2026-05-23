"use client";

import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageSpinner } from "@/components/shared/LoadingSpinner";

interface UserRow {
  id: string;
  email: string;
  name: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
  invitedBy: { name: string | null; email: string } | null;
}

export default function UsuariosPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Invite form
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/usuarios?page=${page}`);
    if (res.ok) {
      const data = await res.json() as { users: UserRow[]; total: number };
      setUsers(data.users);
      setTotal(data.total);
    }
    setLoading(false);
  }, [page]);

  useEffect(() => { void fetchUsers(); }, [fetchUsers]);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviting(true);
    setInviteError(null);
    setInviteSuccess(null);

    const res = await fetch("/api/invitaciones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: inviteEmail, name: inviteName || undefined }),
    });

    setInviting(false);
    if (res.ok) {
      setInviteSuccess(`Invitación enviada a ${inviteEmail}`);
      setInviteEmail("");
      setInviteName("");
    } else {
      const data = await res.json() as { error: string };
      setInviteError(typeof data.error === "string" ? data.error : "Error enviando invitación");
    }
  }

  async function toggleActive(userId: string, current: boolean) {
    await fetch(`/api/usuarios/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !current }),
    });
    void fetchUsers();
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-[#FAFAFA]">Usuarios</h1>
        <p className="text-sm text-[#A1A1AA] mt-1">{total} usuarios registrados</p>
      </div>

      {/* Invite form */}
      <div className="bg-[#18181B] border border-[#27272A] rounded-[12px] p-5">
        <p className="font-semibold text-[#FAFAFA] mb-4">Invitar nuevo cliente</p>
        <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3">
          <Input
            placeholder="Email del cliente"
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            required
            className="flex-1"
          />
          <Input
            placeholder="Nombre (opcional)"
            value={inviteName}
            onChange={(e) => setInviteName(e.target.value)}
            className="flex-1 sm:max-w-[200px]"
          />
          <Button type="submit" loading={inviting} className="flex-shrink-0">
            Enviar invitación
          </Button>
        </form>
        {inviteSuccess && (
          <p className="text-sm text-[#22C55E] mt-2">{inviteSuccess}</p>
        )}
        {inviteError && (
          <p className="text-sm text-[#EF4444] mt-2">{inviteError}</p>
        )}
      </div>

      {/* Users table */}
      {loading ? (
        <PageSpinner />
      ) : (
        <div className="bg-[#18181B] border border-[#27272A] rounded-[12px] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#27272A]">
                  <th className="text-left px-4 py-3 text-[#A1A1AA] font-medium">Usuario</th>
                  <th className="text-left px-4 py-3 text-[#A1A1AA] font-medium">Rol</th>
                  <th className="text-left px-4 py-3 text-[#A1A1AA] font-medium">Estado</th>
                  <th className="text-left px-4 py-3 text-[#A1A1AA] font-medium">Fecha</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-[#27272A] last:border-0 hover:bg-[#27272A]/30"
                  >
                    <td className="px-4 py-3">
                      <p className="text-[#FAFAFA] font-medium">{user.name ?? "—"}</p>
                      <p className="text-xs text-[#A1A1AA]">{user.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={user.role === "admin" ? "primary" : "muted"}>
                        {user.role}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={user.isActive ? "success" : "destructive"}>
                        {user.isActive ? "Activo" : "Revocado"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-[#A1A1AA] text-xs">
                      {new Date(user.createdAt).toLocaleDateString("es-ES")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {user.role !== "admin" && (
                        <Button
                          variant={user.isActive ? "destructive" : "secondary"}
                          size="sm"
                          onClick={() => toggleActive(user.id, user.isActive)}
                        >
                          {user.isActive ? "Revocar" : "Activar"}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {total > 20 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-[#27272A]">
              <p className="text-xs text-[#A1A1AA]">
                Mostrando {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} de {total}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Anterior
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page * 20 >= total}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
