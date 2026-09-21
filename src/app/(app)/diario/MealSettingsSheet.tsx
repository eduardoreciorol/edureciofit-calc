"use client";

import { useState } from "react";
import { UserMeal } from "./DiarioClient";

type Props = {
  meal: UserMeal;
  allMeals: UserMeal[];
  onClose: () => void;
};

type Tab = "comidas" | "objetivos";

export function MealSettingsSheet({ meal, allMeals, onClose }: Props) {
  const [tab, setTab] = useState<Tab>("objetivos");
  const [editingMeal, setEditingMeal] = useState(meal);
  const [allMealsState, setAllMealsState] = useState(allMeals);
  const [newMealName, setNewMealName] = useState("");
  const [saving, setSaving] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [error, setError] = useState("");

  const patchMeal = async (id: string, data: Record<string, unknown>) => {
    const res = await fetch(`/api/diario/comidas/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Error al guardar");
    return res.json();
  };

  const handleSaveTargets = async () => {
    setSaving(true);
    setError("");
    try {
      await patchMeal(editingMeal.id, {
        targetKcal: editingMeal.targetKcal,
        targetProtein: editingMeal.targetProtein,
        targetCarbs: editingMeal.targetCarbs,
        targetFat: editingMeal.targetFat,
      });
      onClose();
    } catch {
      setError("No se pudo guardar. Inténtalo de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  const handleAddMeal = async () => {
    if (!newMealName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/diario/comidas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newMealName.trim() }),
      });
      const created = await res.json();
      setAllMealsState((prev) => [...prev, created]);
      setNewMealName("");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMeal = async (id: string) => {
    const res = await fetch(`/api/diario/comidas/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "No se puede eliminar");
      return;
    }
    setAllMealsState((prev) => prev.filter((m) => m.id !== id));
  };

  const handleRename = async (id: string) => {
    if (!renameValue.trim()) { setRenamingId(null); return; }
    await patchMeal(id, { name: renameValue.trim() });
    setAllMealsState((prev) => prev.map((m) => m.id === id ? { ...m, name: renameValue.trim() } : m));
    if (editingMeal.id === id) setEditingMeal((m) => ({ ...m, name: renameValue.trim() }));
    setRenamingId(null);
  };

  const numericField = (
    label: string,
    value: number | null,
    onChange: (v: number | null) => void,
    color: string
  ) => (
    <div className="flex items-center gap-3">
      <label className="text-sm font-medium flex-1" style={{ color }}>{label}</label>
      <input
        type="number"
        min={0}
        max={1000}
        step={0.1}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value === "" ? null : parseFloat(e.target.value))}
        placeholder="—"
        className="w-24 bg-[#09090B] border border-[#27272A] rounded-lg px-3 py-1.5 text-white text-right text-sm focus:outline-none focus:border-[#3DD6E0]"
      />
      <span className="text-xs text-[#A1A1AA] w-4">g</span>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-full max-w-sm mx-auto bg-[#18181B] rounded-t-2xl border border-[#27272A] max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-[#27272A]">
          <h2 className="text-white font-semibold text-sm">Configurar comidas</h2>
          <button onClick={onClose} className="text-[#A1A1AA] hover:text-white p-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#27272A]">
          {(["objetivos", "comidas"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
                tab === t ? "text-[#3DD6E0] border-b-2 border-[#3DD6E0]" : "text-[#A1A1AA]"
              }`}
            >
              {t === "objetivos" ? "Objetivos" : "Mis comidas"}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto flex-1 px-4 py-4">
          {tab === "objetivos" ? (
            <div className="flex flex-col gap-4">
              <p className="text-xs text-[#A1A1AA]">
                Fija los macros objetivo de <span className="text-white font-medium">{editingMeal.name}</span>. Déjalo vacío si no quieres objetivo para ese macro.
              </p>

              {numericField("Proteína", editingMeal.targetProtein, (v) => setEditingMeal((m) => ({ ...m, targetProtein: v })), "#D4175A")}
              {numericField("Hidratos", editingMeal.targetCarbs, (v) => setEditingMeal((m) => ({ ...m, targetCarbs: v })), "#3DD6E0")}
              {numericField("Grasa", editingMeal.targetFat, (v) => setEditingMeal((m) => ({ ...m, targetFat: v })), "#F59E0B")}

              <div className="border-t border-[#27272A] pt-3">
                {numericField("Calorías", editingMeal.targetKcal, (v) => setEditingMeal((m) => ({ ...m, targetKcal: v })), "#A1A1AA")}
                <p className="text-[10px] text-[#52525B] mt-1">Opcional · solo para referencia visual</p>
              </div>

              {error && <p className="text-xs text-red-400">{error}</p>}

              <button
                onClick={handleSaveTargets}
                disabled={saving}
                className="w-full py-3 rounded-xl font-bold text-sm text-black disabled:opacity-40"
                style={{ background: "linear-gradient(90deg, #3DD6E0, #D4175A)" }}
              >
                {saving ? "Guardando..." : "Guardar objetivos"}
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-xs text-[#A1A1AA]">Gestiona tus comidas: renombra, añade o elimina.</p>

              {allMealsState.map((m) => (
                <div key={m.id} className="flex items-center gap-2 bg-[#09090B] rounded-xl px-3 py-2.5 border border-[#27272A]">
                  {renamingId === m.id ? (
                    <input
                      autoFocus
                      type="text"
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onBlur={() => handleRename(m.id)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleRename(m.id); if (e.key === "Escape") setRenamingId(null); }}
                      className="flex-1 bg-transparent text-white text-sm focus:outline-none border-b border-[#3DD6E0]"
                    />
                  ) : (
                    <span className="flex-1 text-sm text-white">{m.name}</span>
                  )}
                  <button
                    onClick={() => { setRenamingId(m.id); setRenameValue(m.name); }}
                    className="p-1 text-[#A1A1AA] hover:text-[#3DD6E0] transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDeleteMeal(m.id)}
                    className="p-1 text-[#A1A1AA] hover:text-red-400 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}

              {/* Add meal */}
              <div className="flex gap-2 mt-1">
                <input
                  type="text"
                  value={newMealName}
                  onChange={(e) => setNewMealName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddMeal()}
                  placeholder="Nueva comida..."
                  className="flex-1 bg-[#09090B] border border-[#27272A] rounded-lg px-3 py-2 text-sm text-white placeholder:text-[#52525B] focus:outline-none focus:border-[#3DD6E0]"
                />
                <button
                  onClick={handleAddMeal}
                  disabled={!newMealName.trim() || saving}
                  className="px-4 py-2 rounded-lg font-bold text-black text-sm disabled:opacity-40"
                  style={{ background: "#3DD6E0" }}
                >
                  +
                </button>
              </div>

              {error && <p className="text-xs text-red-400">{error}</p>}

              <button onClick={onClose} className="w-full py-3 rounded-xl font-bold text-sm text-white bg-[#27272A] mt-1">
                Cerrar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
