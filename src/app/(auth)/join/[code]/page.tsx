"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function JoinPage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== password2) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/registro", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: params.code, email, name, password }),
    });

    if (!res.ok) {
      const data = await res.json() as { error: string | { formErrors: string[] } };
      const msg =
        typeof data.error === "string"
          ? data.error
          : (data.error.formErrors?.[0] ?? "Error al crear cuenta");
      setError(msg);
      setLoading(false);
      return;
    }

    // Auto sign-in after registration
    const supabase = getSupabaseBrowserClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setError("Cuenta creada. Ve al login para entrar.");
      setDone(true);
      setLoading(false);
      return;
    }

    setDone(true);
    router.push("/swap");
    router.refresh();
  }

  if (done) {
    return (
      <div className="bg-[#18181B] border border-[#27272A] rounded-[16px] p-6 text-center">
        <p className="text-3xl mb-3">💪</p>
        <p className="font-semibold text-[#FAFAFA] mb-1">¡Cuenta creada!</p>
        <p className="text-sm text-[#A1A1AA]">Entrando a la app…</p>
      </div>
    );
  }

  return (
    <div className="bg-[#18181B] border border-[#27272A] rounded-[16px] p-6">
      <div className="mb-6">
        <p className="text-xl font-bold text-[#FAFAFA]">Accede a la Calculadora 💪</p>
        <p className="text-sm text-[#A1A1AA] mt-1">
          Crea tu cuenta para calcular equivalencias de alimentos.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Tu nombre"
          placeholder="Ej: María García"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoComplete="name"
        />
        <Input
          label="Email"
          type="email"
          placeholder="tu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
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
          Crear mi cuenta
        </Button>
      </form>

      <p className="text-xs text-[#52525B] text-center mt-4">
        ¿Ya tienes cuenta?{" "}
        <a href="/login" className="text-[#A1A1AA] underline">
          Iniciar sesión
        </a>
      </p>
    </div>
  );
}
