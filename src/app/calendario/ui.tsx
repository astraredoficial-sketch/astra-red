"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppNav } from "@/components/AppNav";
import { VipPaywall } from "@/components/VipPaywall";
import { findOptimalAstralDates, AstralCalculationResult } from "@/lib/astronomyEngine";
import { getCurrentAccount, getAllAccounts, saveAccounts, Account } from "@/lib/userStore";

interface AstralEvent {
  id: string;
  title: string;
  category: string;
  date: string;
  lunarPhase: string;
  bestTime: string;
  note: string;
  status: "programada" | "notificada";
}

export function CalendarioUi() {
  const [currentAccount, setCurrentAccount] = useState<Account | null>(null);

  const [activeTab, setActiveTab] = useState<"ia" | "sinastria">("ia");
  const [iaQuery, setIaQuery] = useState("");
  const [isProcessingIa, setIsProcessingIa] = useState(false);
  const [iaSuggestions, setIaSuggestions] = useState<AstralCalculationResult[]>([]);

  const [appNotifications, setAppNotifications] = useState<Array<{ id: string; msg: string; time: string }>>([
    { id: "n1", msg: "?? Sistema conectado a Efemérides Astronómicas Reales (SunCalc).", time: "Ahora" },
  ]);

  const [savedEvents, setSavedEvents] = useState<AstralEvent[]>([
    {
      id: "ev-1",
      title: "Corte de cabello para crecimiento rápido",
      category: "cabello",
      date: "2026-10-15",
      lunarPhase: "Luna Creciente ??",
      bestTime: "10:00 AM - 02:00 PM",
      note: "Cálculo matemático verificado con posición celeste.",
      status: "programada",
    },
  ]);

  useEffect(() => {
    setCurrentAccount(getCurrentAccount());
  }, []);

  const handleUpgradeToVip = () => {
    if (!currentAccount) return;
    const all = getAllAccounts();
    const updated = all.map((acc) =>
      acc.id === currentAccount.id ? { ...acc, membership: "vip" as const } : acc
    );
    saveAccounts(updated);
    setCurrentAccount({ ...currentAccount, membership: "vip" });
    alert("?? ¡Felicidades " + currentAccount.name + "! Has activado Astra Red VIP ($4$4.99/mes). Acceso total desbloqueado.");
  };

  const handleIaSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!iaQuery.trim()) return;

    setIsProcessingIa(true);
    setIaSuggestions([]);

    setTimeout(() => {
      const q = iaQuery.toLowerCase();
      let targetYear = 2026;
      let startM = 10;
      let endM = 12;

      if (q.includes("2027")) {
        targetYear = 2027;
        startM = 1;
        endM = 12;
      } else if (q.includes("diciembre")) {
        targetYear = 2026;
        startM = 12;
        endM = 12;
      }

      const results = findOptimalAstralDates(iaQuery, targetYear, startM, endM);
      setIaSuggestions(results);
      setIsProcessingIa(false);
    }, 600);
  };

  const handleSelectIaSuggestion = (sug: AstralCalculationResult) => {
    const created: AstralEvent = {
      id: Date.now().toString(),
      title: iaQuery || "Actividad Astronómica",
      category: "ia",
      date: sug.date,
      lunarPhase: sug.phaseName,
      bestTime: sug.bestTime,
      note: sug.recommendation,
      status: "programada",
    };

    setSavedEvents([created, ...savedEvents]);

    const notifMsg = "?? Alerta en la App: Te notificaremos el " + sug.date + " para \"" + iaQuery + "\" con base en el cálculo celeste real.";
    setAppNotifications([{ id: Date.now().toString(), msg: notifMsg, time: "Ahora mismo" }, ...appNotifications]);
    alert("¡Alerta guardada! Efeméride astronómica programada para el " + sug.date + ".");
  };

  const handleDeleteEvent = (id: string) => {
    setSavedEvents(savedEvents.filter((ev) => ev.id !== id));
  };

  const isFree = currentAccount?.membership === "free";

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col relative overflow-x-hidden">
      <AppNav active="calendario" />

      {/* MODAL BLOQUEANTE DE SUSCRIPCIÓN (PAYWALL) PARA USUARIOS FREE */}
      {isFree && <VipPaywall name={currentAccount?.name || "Usuario"} onUpgrade={handleUpgradeToVip} />}

      <main className={"max-w-5xl mx-auto p-4 sm:p-6 space-y-6 w-full flex-1 transition " + (isFree ? "blur-md pointer-events-none select-none opacity-30" : "")}>
        {/* ENCABEZADO */}
        <div className="bg-gradient-to-r from-amber-950/60 via-purple-950/40 to-slate-900 border border-amber-500/30 rounded-3xl p-6 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-gradient-to-r from-amber-400 to-amber-600 text-slate-950 font-black text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                MOTOR CIENTÍFICO 100% REAL ?
              </span>
              <span className="text-xs text-amber-300 font-medium">Cálculos Lunares Activos</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-serif text-white">Calendario de Efemérides Reales</h1>
            <p className="text-xs text-slate-300">
              Cálculos matemáticos exactos basados en la posición celeste y fases lunares científicas.
            </p>
          </div>

          <div className="flex bg-slate-900/90 border border-slate-800 p-1.5 rounded-2xl gap-1">
            <button
              onClick={() => setActiveTab("ia")}
              className={"px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer " + (activeTab === "ia" ? "bg-amber-500 text-slate-950 shadow-md font-bold" : "text-slate-400 hover:text-white")}
            >
              ?? Motor Científico
            </button>
            <button
              onClick={() => setActiveTab("sinastria")}
              className={"px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer " + (activeTab === "sinastria" ? "bg-amber-500 text-slate-950 shadow-md font-bold" : "text-slate-400 hover:text-white")}
            >
              ?? Sinastría VIP
            </button>
          </div>
        </div>

        {/* NOTIFICACIONES DE LA APP */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold font-serif text-amber-300 uppercase tracking-widest flex items-center gap-2">
              <span>??</span> NOTIFICACIONES DE LA APP
            </h3>
            <span className="bg-rose-950 text-rose-300 text-[10px] px-2 py-0.5 rounded-full border border-rose-500/30 font-bold">
              {appNotifications.length} Activas
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {appNotifications.map((n) => (
              <div key={n.id} className="bg-slate-950 border border-slate-800/80 p-2.5 rounded-xl flex items-start justify-between gap-2">
                <span className="text-slate-200">{n.msg}</span>
                <span className="text-[9px] text-slate-500 whitespace-nowrap font-mono">{n.time}</span>
              </div>
            ))}
          </div>
        </div>

        {activeTab === "ia" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
              <h3 className="text-xs font-bold font-serif text-amber-300 uppercase tracking-widest flex items-center gap-2">
                <span>??</span> CONSULTA MATEMÁTICA
              </h3>

              <form onSubmit={handleIaSearch} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">¿Qué deseas calcular para el 2026 o 2027?</label>
                  <textarea
                    rows={3}
                    placeholder="Ej: 'quiero cortarme el cabello en el 2027' o 'cosechar maíz en 2027'"
                    value={iaQuery}
                    onChange={(e) => setIaQuery(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-white focus:outline-none focus:border-amber-500 transition resize-none leading-relaxed font-medium"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isProcessingIa}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 to-rose-500 hover:opacity-90 text-slate-950 font-extrabold rounded-2xl transition shadow-xl uppercase tracking-wider cursor-pointer"
                >
                  {isProcessingIa ? "Calculando Coordenadas..." : "?? Calcular con Motor Real"}
                </button>
              </form>

              <div className="space-y-1.5 pt-2 border-t border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Pruebas recomendadas:</span>
                <div className="flex flex-col gap-1 text-[11px]">
                  <button onClick={() => setIaQuery("quiero cortarme el cabello en el 2027")} className="text-left text-rose-300 hover:underline cursor-pointer">
                    ?? "quiero cortarme el cabello en el 2027"
                  </button>
                  <button onClick={() => setIaQuery("cosechar maíz en 2027")} className="text-left text-amber-300 hover:underline cursor-pointer">
                    ?? "cosechar maíz en 2027"
                  </button>
                  <button onClick={() => setIaQuery("podar plantas en diciembre")} className="text-left text-emerald-300 hover:underline cursor-pointer">
                    ?? "podar plantas en diciembre"
                  </button>
                </div>
              </div>
            </div>

            <div className="md:col-span-2 space-y-4">
              <h3 className="text-xs font-bold font-serif text-slate-300 uppercase tracking-widest">
                RESULTADOS DE EFEMÉRIDES CELESTES
              </h3>

              {iaSuggestions.length > 0 ? (
                <div className="space-y-3">
                  {iaSuggestions.map((sug, idx) => (
                    <div key={idx} className="bg-slate-900 border border-amber-500/30 hover:border-amber-400 rounded-3xl p-5 shadow-xl space-y-3 transition">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                        <div>
                          <span className="bg-amber-950/80 text-amber-300 border border-amber-500/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">
                            {sug.phaseName}
                          </span>
                          <h4 className="text-base font-bold text-white mt-1 capitalize">{iaQuery} (Ventana {idx + 1})</h4>
                        </div>
                        <div className="text-left sm:text-right">
                          <span className="text-xs text-amber-400 font-bold block">{sug.date}</span>
                          <span className="text-[10px] text-rose-300 font-mono font-bold">? {sug.bestTime}</span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-2xl border border-slate-800">
                        {sug.recommendation}
                      </p>

                      <button
                        onClick={() => handleSelectIaSuggestion(sug)}
                        className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-2xl transition shadow-lg uppercase tracking-wider cursor-pointer"
                      >
                        ?? Guardar Alerta en la App para esta fecha real
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-slate-900/60 border border-dashed border-slate-800 rounded-3xl p-8 text-center space-y-3">
                  <span className="text-4xl">??</span>
                  <h4 className="text-sm font-bold text-slate-300">Escribe tu consulta en el panel izquierdo</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    El motor matemático procesará las efemérides celestes reales de forma inmediata.
                  </p>
                </div>
              )}

              <div className="pt-4 space-y-3">
                <h4 className="text-xs font-bold font-serif text-slate-400 uppercase tracking-widest">
                  MIS ALERTAS GUARDADAS EN LA APP
                </h4>

                <div className="space-y-2">
                  {savedEvents.length > 0 ? (
                    savedEvents.map((ev) => (
                      <div key={ev.id} className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
                        <div className="space-y-1">
                          <span className="text-amber-400 font-bold text-xs">{ev.date} · {ev.lunarPhase}</span>
                          <h5 className="text-sm font-bold text-white">{ev.title}</h5>
                          <p className="text-xs text-slate-400">{ev.note}</p>
                        </div>
                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <span className="bg-emerald-950 text-emerald-300 text-[10px] px-2.5 py-1 rounded-full border border-emerald-500/30 font-semibold">
                            Notificaciones Activas
                          </span>
                          <button
                            onClick={() => handleDeleteEvent(ev.id)}
                            className="px-3 py-1 bg-rose-950/80 hover:bg-rose-900 border border-rose-500/40 text-rose-300 text-xs font-bold rounded-xl transition cursor-pointer"
                          >
                            ??? Eliminar
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500 italic">No tienes alertas guardadas actualmente.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "sinastria" && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
            <h3 className="text-xl font-bold font-serif text-white">Análisis de Sinastría Cósmica</h3>
            <p className="text-xs text-slate-400">Cálculo de compatibilidad basado en aspectos planetarios reales.</p>
          </div>
        )}
      </main>
    </div>
  );
}

