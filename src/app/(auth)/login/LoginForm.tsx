"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Mode = "login" | "register";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<Mode>("login");

  // Login fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Register fields
  const [name, setName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");
  const [code, setCode] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const errorParam = searchParams.get("error");
  const redirectTo = searchParams.get("redirect") ?? "/swap";

  function switchMode(m: Mode) {
    setMode(m);
    setError(null);
    setSuccess(null);
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = getSupabaseBrowserClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError("Email o contraseña incorrectos");
      setLoading(false);
      return;
    }

    router.push(redirectTo);
    router.refresh();
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (regPassword !== regConfirm) {
      setError("Las contraseñas no coinciden");
      return;
    }
    if (regPassword.length < 6) {
      setError("La contraseña debe tener mínimo 6 caracteres");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/registro", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, email: regEmail, name, password: regPassword }),
    });

    const data = await res.json() as { success?: boolean; error?: string | { formErrors: string[] } };

    if (!res.ok) {
      const msg = typeof data.error === "string"
        ? data.error
        : "Error al crear la cuenta";
      setError(msg);
      setLoading(false);
      return;
    }

    // Auto-login after registration
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signInWithPassword({ email: regEmail, password: regPassword });

    router.push("/swap");
    router.refresh();
  }

  return (
    <div className="bg-[#18181B]/90 backdrop-blur-sm border border-[#27272A] rounded-[16px] p-6">
      {/* Tab toggle */}
      <div className="flex rounded-[10px] bg-[#27272A] p-1 mb-6 gap-1">
        <button
          type="button"
          onClick={() => switchMode("login")}
          className={`flex-1 py-2 text-sm font-semibold rounded-[8px] transition-colors ${
            mode === "login"
              ? "bg-[#3DD6E0] text-[#09090B]"
              : "text-[#A1A1AA] hover:text-[#FAFAFA]"
          }`}
        >
          Iniciar sesión
        </button>
        <button
          type="button"
          onClick={() => switchMode("register")}
          className={`flex-1 py-2 text-sm font-semibold rounded-[8px] transition-colors ${
            mode === "register"
              ? "bg-[#3DD6E0] text-[#09090B]"
              : "text-[#A1A1AA] hover:text-[#FAFAFA]"
          }`}
        >
          Crear cuenta
        </button>
      </div>

      {errorParam === "cuenta_desactivada" && (
        <div className="mb-4 p-3 bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-[8px]">
          <p className="text-sm text-[#EF4444]">Tu acceso ha sido desactivado. Contacta con Eduardo.</p>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-[8px]">
          <p className="text-sm text-[#EF4444]">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-[#22C55E]/10 border border-[#22C55E]/20 rounded-[8px]">
          <p className="text-sm text-[#22C55E]">{success}</p>
        </div>
      )}

      {/* ── LOGIN ── */}
      {mode === "login" && (
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
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
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
          <Button type="submit" size="lg" loading={loading} className="mt-2 w-full">
            Entrar
          </Button>
        </form>
      )}

      {/* ── REGISTER ── */}
      {mode === "register" && (
        <form onSubmit={handleRegister} className="flex flex-col gap-4">
          <Input
            label="Nombre"
            type="text"
            placeholder="Tu nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
          />
          <Input
            label="Email"
            type="email"
            placeholder="tu@email.com"
            value={regEmail}
            onChange={(e) => setRegEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <Input
            label="Contraseña"
            type="password"
            placeholder="Mínimo 6 caracteres"
            value={regPassword}
            onChange={(e) => setRegPassword(e.target.value)}
            required
            autoComplete="new-password"
          />
          <Input
            label="Confirmar contraseña"
            type="password"
            placeholder="Repite tu contraseña"
            value={regConfirm}
            onChange={(e) => setRegConfirm(e.target.value)}
            required
            autoComplete="new-password"
          />
          <Input
            label="Código de acceso"
            type="text"
            placeholder="Código proporcionado por Eduardo"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
          />
          <Button type="submit" size="lg" loading={loading} className="mt-2 w-full">
            Crear cuenta
          </Button>
        </form>
      )}
    </div>
  );
}
