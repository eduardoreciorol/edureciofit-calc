"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function LoginForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [harbizEmail, setHarbizEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // 1. Get a one-time token from the server
    const res = await fetch("/api/auth/acceso", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), harbizEmail: harbizEmail.trim() }),
    });

    if (!res.ok) {
      setError("No se pudo acceder. Inténtalo de nuevo.");
      setLoading(false);
      return;
    }

    const { token_hash } = await res.json() as { token_hash: string };

    // 2. Verify the token to create a session client-side (no email needed)
    const supabase = getSupabaseBrowserClient();
    const { error: verifyError } = await supabase.auth.verifyOtp({
      token_hash,
      type: "email",
    });

    if (verifyError) {
      setError("Error al iniciar sesión. Inténtalo de nuevo.");
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="bg-[#18181B]/90 backdrop-blur-sm border border-[#27272A] rounded-[16px] p-6">
      <div className="mb-6 text-center">
        <p className="text-sm text-[#A1A1AA]">Escribe tu nombre y el email con el que estás en Harbiz</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-[8px]">
          <p className="text-sm text-[#EF4444]">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Tu nombre"
          type="text"
          placeholder="Nombre y apellido"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoComplete="name"
        />
        <Input
          label="Tu email en Harbiz"
          type="email"
          placeholder="email@ejemplo.com"
          value={harbizEmail}
          onChange={(e) => setHarbizEmail(e.target.value)}
          required
          autoComplete="email"
        />
        <Button type="submit" size="lg" loading={loading} className="mt-2 w-full">
          Entrar
        </Button>
      </form>
    </div>
  );
}
