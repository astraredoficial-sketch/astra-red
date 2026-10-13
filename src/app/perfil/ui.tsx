// Código corregido para src/app/perfil/ui.tsx
"use client";

import React, { useState } from "react";

export function PerfilUI() {
  const [activeTab, setActiveTab] = useState<string>("perfil");

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold text-white">Perfil de Usuario</h1>
      <div className="flex space-x-2">
        <button
          type="button"
          onClick={() => setActiveTab("perfil")}
          className={`px-4 py-2 rounded-lg ${activeTab === "perfil" ? "bg-rose-600 text-white" : "bg-slate-800 text-slate-300"}`}
        >
          Perfil
        </button>
      </div>
    </div>
  );
}
