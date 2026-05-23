"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PageSpinner } from "@/components/shared/LoadingSpinner";

interface InvitationData {
  email: string;
  expires_at: string;
}

export default function InvitePage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [validating, setValidating] = useState(true);
  const [tokenError, setTokenError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function validate() {
      const res = await fetch(`/api/invitaciones/${params.token}`);
      if (!res.ok) {
        const data = await res.json() as { error: string };
        setTokenError(data.error);
      } else {
        const data = await res.json() as InvitationData;
        setInvitation(data);
      }
      setValidating(false);
    }
    void validate();
  }, [params.token]);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (password !== password2) {
      setError("Las contraseñas no coinciden");
      return;
    }
    setLoading(true);
    setError(null);

    const res = await fetch(`/api/invitaciones/${params.token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, password }),
    });

    if (!res.ok) {
      const data = await res.json() as { error: string | { formErrors: string[] } };
      const msg = typeof data.error === "string" ? data.error : "Error al crear cuenta";
      setError(msg);
      setLoading(false);
      return;
    }

    // Auto sign-in
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signInWithPassword({
      email: invitation!.email,
      password,
    });

    router.push("/swap");
    router.refresh();
  }

  if (validating) return <PageSpinner />;

  if (tokenError) {
    return (
      <div className="bg-[#18181B] border border-[#27272A] rounded-[16px] p-6 text-center">
        <p className="text-2xl mb-3">⚠️</p>
        <p className="font-semibold text-[#FAFAFA] mb-1">Invitación no válida</p>
        <p className="text-sm text-[#A1A1AA]">{tokenError}</p>
      </div>
    );
  }

  return (
    <div className="bg-[#18181B] border border-[#27272A] rounded-[16px] p-6">
      <div className="mb-5">
        <p className="font-semibold text-[#FAFAFA]">Activa tu cuenta 💪</p>
        <p className="text-sm text-[#A1A1AA] mt-1">
          Accediendo como <strong className="text-[#FAFAFA]">{invitation?.email}</strong>
        </p>
      </div>

      <form onSubmit={handleRegister} className="flex flex-col gap-4">
        <Input
          label="Tu nombre"
          placeholder="Eduardo"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoComplete="name"
        />
        <Input
          label="Contraseña"
          type="password"
          placeholder="Mínimo 8 caracteres"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="new-password"
        />
        <Input
          label="Repite contraseña"
          type="password"
          placeholder="••••••••"
          value={password2}
          onChange={(e) => setPassword2(e.target.value)}
          required
          autoComplete="new-password"
        />

        {error && <p className="text-sm text-[#EF4444]">{error}</p>}

        <Button type="submit" size="lg" loading={loading} className="mt-2 w-full">
          Activar mi cuenta
        </Button>
      </form>
    </div>
  );
}
