"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
/* eslint-disable @next/next/no-img-element */

type Profile = {
  id: string;
  name: string | null;
  email: string;
  harbizEmail: string | null;
  role: string;
};

export function PerfilClient() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState("");
  const [harbizEmail, setHarbizEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((data: Profile) => {
        setProfile(data);
        setName(data.name ?? "");
        setHarbizEmail(data.harbizEmail ?? "");
      });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSaved(false);
    const res = await fetch("/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim() || undefined,
        harbizEmail: harbizEmail.trim() || null,
      }),
    });
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } else {
      setError("No se pudo guardar. Inténtalo de nuevo.");
    }
  };

  const APP_SECTIONS = [
    {
      href: "/swap",
      label: "Intercambiador",
      desc: "Sustituye un alimento manteniendo los macros",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      ),
      color: "#3DD6E0",
    },
    {
      href: "/diario",
      label: "Diario",
      desc: "Registra tus comidas y controla tus macros diarios",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
      color: "#D4175A",
    },
    {
      href: "/receta",
      label: "Receta",
      desc: "Calcula los macros de una receta completa",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      color: "#F59E0B",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header with logo */}
      <div className="flex flex-col items-center pt-8 pb-6 px-4">
        <img
          src="/logo-horizontal.png"
          alt="Creando Gigantes"
          style={{ width: "180px", height: "auto", objectFit: "contain", transform: "translateX(8px)" }}
        />
      </div>

      <div className="flex flex-col gap-5 px-4 pb-8">
        {/* Profile card */}
        <div className="rounded-2xl bg-[#18181B] border border-[#27272A] overflow-hidden">
          <div className="px-5 pt-5 pb-1">
            <h2 className="text-white font-bold text-base">Tu perfil</h2>
            <p className="text-xs text-[#A1A1AA] mt-0.5">Así te identificamos en la plataforma</p>
          </div>

          <form onSubmit={handleSave} className="px-5 py-4 flex flex-col gap-4">
            {/* Name */}
            <div>
              <label className="text-xs font-medium text-[#A1A1AA] mb-1.5 block">Tu nombre</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nombre y apellido"
                className="w-full bg-[#09090B] border border-[#27272A] rounded-xl px-4 py-3 text-white text-sm placeholder:text-[#52525B] focus:outline-none focus:border-[#3DD6E0] transition-colors"
              />
            </div>

            {/* Harbiz email */}
            <div>
              <label className="text-xs font-medium text-[#A1A1AA] mb-1.5 block">
                Tu email en Harbiz
              </label>
              <input
                type="email"
                value={harbizEmail}
                onChange={(e) => setHarbizEmail(e.target.value)}
                placeholder="email@ejemplo.com"
                className="w-full bg-[#09090B] border border-[#27272A] rounded-xl px-4 py-3 text-white text-sm placeholder:text-[#52525B] focus:outline-none focus:border-[#3DD6E0] transition-colors"
              />
              <p className="text-[11px] text-[#52525B] mt-1.5">
                El mismo que usas para acceder a Harbiz
              </p>
            </div>

            {error && <p className="text-xs text-red-400">{error}</p>}

            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="w-full py-3 rounded-xl font-bold text-sm text-black disabled:opacity-40 transition-opacity"
              style={{ background: saved ? "#22C55E" : "linear-gradient(90deg, #3DD6E0, #D4175A)" }}
            >
              {saving ? "Guardando..." : saved ? "✓ Guardado" : "Guardar"}
            </button>
          </form>
        </div>

        {/* App sections */}
        <div className="flex flex-col gap-2.5">
          <p className="text-xs text-[#A1A1AA] font-medium uppercase tracking-wider px-1">Herramientas</p>
          {APP_SECTIONS.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="flex items-center gap-4 bg-[#18181B] border border-[#27272A] rounded-2xl px-4 py-4 hover:border-[#3DD6E0]/40 transition-colors"
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${s.color}18` }}
              >
                <span style={{ color: s.color }}>{s.icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm">{s.label}</p>
                <p className="text-xs text-[#A1A1AA] mt-0.5">{s.desc}</p>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#52525B] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>

        {/* Admin link (only shown to admins) */}
        {profile?.role === "admin" && (
          <Link
            href="/admin"
            className="flex items-center gap-4 bg-[#18181B] border border-[#D4175A]/30 rounded-2xl px-4 py-4 hover:border-[#D4175A]/60 transition-colors"
          >
            <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-[#D4175A]/10">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#D4175A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-white font-semibold text-sm">Panel de admin</p>
              <p className="text-xs text-[#A1A1AA] mt-0.5">Gestiona usuarios y alimentos</p>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#52525B] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        )}
      </div>
    </div>
  );
}
