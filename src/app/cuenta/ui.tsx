"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppNav } from "@/components/AppNav";
import { getAllAccounts, saveAccounts, Account } from "@/lib/userStore";

export function CuentaUi() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const [showVipModal, setShowVipModal] = useState(false);

  useEffect(() => {
    setAccounts(getAllAccounts());
  }, []);

  const currentAccount = accounts.find((a) => a.isCurrent) || accounts[0] || {
    id: "acc-1",
    name: "Cargando...",
    email: "",
    avatar: "??",
    location: "",
    membership: "free" as const,
    joinedDate: "",
    isCurrent: true
  };

  const handleSwitchAccount = (id: string) => {
    const updated = accounts.map((acc) => ({
      ...acc,
      isCurrent: acc.id === id,
    }));
    setAccounts(updated);
    saveAccounts(updated);
    setShowSwitchModal(false);
  };

  const handleUpgradeToVip = () => {
    const updated = accounts.map((acc) =>
      acc.isCurrent ? { ...acc, membership: "vip" as const } : acc
    );
    setAccounts(updated);
    saveAccounts(updated);
    setShowVipModal(false);
    alert("?? ¡Felicidades " + currentAccount.name + "! Has activado Astra Red VIP ($4$4$4$4.99/mes).");
  };

  const handleLogout = () => {
    if (confirm("¿Deseas cerrar sesión? Se requerirá tu correo y contraseña para ingresar de nuevo.")) {
      const resetAccounts = accounts.map((acc) => ({ ...acc, isCurrent: false }));
      saveAccounts(resetAccounts);
      window.location.href = "/";
    }
  };

  // ELIMINAR CUENTA Y BORRAR TODOS LOS DATOS
  const handleDeleteAccount = () => {
    const confirmation = confirm(
      "?? ¿ESTÁS COMPLETAMENTE SEGURO/A?\n\nEsta acción borrará permanentemente tu cuenta (" +
        currentAccount.name +
        "), tus correos, cartas astrales y configuraciones. Tendrás que inscribirte nuevamente desde cero."
    );

    if (!confirmation) return;

    // Filtrar y remover la cuenta activa
    const remaining = accounts.filter((a) => a.id !== currentAccount.id);

    if (remaining.length > 0) {
      // Activar la primera cuenta restante
      remaining[0].isCurrent = true;
      setAccounts(remaining);
      saveAccounts(remaining);
      alert("? Cuenta eliminada con éxito. Se ha cambiado a tu otra cuenta guardada.");
    } else {
      // Borrar completamente el almacenamiento local y redirigir al registro desde cero
      if (typeof window !== "undefined") {
        localStorage.clear();
      }
      alert("? Tu cuenta y todos tus datos astrales han sido eliminados de forma definitiva.");
      window.location.href = "/onboarding";
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col relative">
      <AppNav active="cuenta" />

      {/* MODAL PAYWALL VIP */}
      {showVipModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-gradient-to-b from-slate-900 via-purple-950/60 to-slate-950 border border-amber-500/40 rounded-3xl p-6 sm:p-8 max-w-lg w-full text-center space-y-6 shadow-2xl relative">
            
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-400 to-amber-600 text-slate-950 font-black text-[11px] px-3 py-1 rounded-full uppercase tracking-wider shadow-lg">
              <span>?</span> ACCESO RESTRINGIDO A PLAN FREE
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-bold font-serif text-white">
                Hola {currentAccount.name}, Desbloquea tu VIP
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
                Tu cuenta actualmente está en el <span className="text-rose-400 font-bold">Plan Free</span>. Suscríbete a Astra Red VIP para calcular efemérides astronómicas exactas.
              </p>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-left text-xs space-y-2.5">
              <div className="flex items-center gap-2 text-slate-200">
                <span className="text-amber-400 font-bold">?</span>
                <span>Motor de Búsqueda Científico de Efemérides Celestiales.</span>
              </div>
              <div className="flex items-center gap-2 text-slate-200">
                <span className="text-amber-400 font-bold">?</span>
                <span>Notificaciones de Alertas Activas ilimitadas.</span>
              </div>
              <div className="flex items-center gap-2 text-slate-200">
                <span className="text-amber-400 font-bold">?</span>
                <span>Análisis ilimitado de Sinastría Cósmica VIP.</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="bg-slate-900 border-2 border-amber-500/50 rounded-2xl p-3.5 flex flex-col justify-between text-left relative shadow-xl">
                <span className="bg-amber-500 text-slate-950 text-[9px] font-black px-2 py-0.5 rounded-full uppercase absolute -top-2.5 right-3">
                  Recomendado
                </span>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Plan Mensual</span>
                  <span className="text-2xl font-black font-serif text-amber-300">$4$4.99 <span className="text-xs font-normal text-slate-400">/ mes</span></span>
                </div>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3.5 flex flex-col justify-between text-left opacity-80 hover:opacity-100 transition">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Plan Anual</span>
                  <span className="text-2xl font-black font-serif text-white">$4$4.99 <span className="text-xs font-normal text-slate-400">/ año</span></span>
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={handleUpgradeToVip}
                className="w-full py-3.5 bg-gradient-to-r from-amber-400 via-amber-500 to-rose-500 hover:opacity-90 text-slate-950 font-extrabold rounded-2xl transition shadow-xl uppercase tracking-wider text-xs cursor-pointer transform hover:scale-[1.02]"
              >
                ? Suscribirme Ahora ($4$4$4$4.99/mes)
              </button>

              <button
                onClick={() => setShowVipModal(false)}
                className="block w-full py-2.5 text-slate-400 hover:text-white text-xs font-semibold transition cursor-pointer"
              >
                Volver a la sección Cuenta
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6 w-full flex-1">
        {/* ENCABEZADO DE CUENTA */}
        <div className="bg-gradient-to-r from-slate-900 via-purple-950/40 to-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="w-16 h-16 bg-slate-800 border-2 border-amber-500/50 rounded-2xl flex items-center justify-center text-3xl shadow-lg">
              {currentAccount.avatar}
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h1 className="text-xl font-bold font-serif text-white">{currentAccount.name}</h1>
                <span
                  className={
                    "text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase " +
                    (currentAccount.membership === "vip"
                      ? "bg-gradient-to-r from-amber-400 to-amber-600 text-slate-950 shadow-md"
                      : "bg-slate-800 text-slate-300 border border-slate-700")
                  }
                >
                  {currentAccount.membership === "vip" ? "? ASTRA VIP" : "?? PLAN FREE"}
                </span>
              </div>
              <p className="text-xs text-slate-400">{currentAccount.email}</p>
              <p className="text-[11px] text-amber-300 font-mono">
                ?? {currentAccount.location} · Miembro desde {currentAccount.joinedDate}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {currentAccount.membership === "free" ? (
              <button
                onClick={() => setShowVipModal(true)}
                className="px-4 py-2.5 bg-gradient-to-r from-amber-400 to-amber-600 text-slate-950 text-xs font-black rounded-xl transition cursor-pointer shadow-lg uppercase tracking-wider"
              >
                ? Cambiar a VIP
              </button>
            ) : (
              <button
                onClick={() => {
                  const updated = accounts.map((acc) =>
                    acc.isCurrent ? { ...acc, membership: "free" as const } : acc
                  );
                  setAccounts(updated);
                  saveAccounts(updated);
                }}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Cambiar a Free
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
              <h3 className="text-xs font-bold font-serif text-amber-400 uppercase tracking-widest flex items-center gap-2">
                <span>?</span> DETALLES DE TU MEMBRESÍA
              </h3>
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Usuario activo:</span>
                  <span className="font-bold text-white">{currentAccount.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Tipo de plan actual:</span>
                  <span className="font-bold text-amber-300 uppercase">
                    {currentAccount.membership === "vip" ? "Astra Red VIP (Ilimitado)" : "Astra Red Free"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Motor Astronómico:</span>
                  <span className="text-emerald-400 font-bold">Activo (SunCalc & Efemérides)</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
              <h3 className="text-xs font-bold font-serif text-slate-300 uppercase tracking-widest flex items-center gap-2">
                <span>??</span> INFORMACIÓN PERSONAL
              </h3>
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Nombre Completo</label>
                    <input
                      type="text"
                      key={currentAccount.id + "-name"}
                      defaultValue={currentAccount.name}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Correo Electrónico</label>
                    <input
                      type="email"
                      key={currentAccount.id + "-email"}
                      defaultValue={currentAccount.email}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500 font-medium"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 md:col-span-1">
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
              <h3 className="text-xs font-bold font-serif text-slate-400 uppercase tracking-widest">
                SESIÓN Y ACCESOS
              </h3>

              <div className="space-y-2 text-xs">
                <Link
                  href="/"
                  className="w-full py-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 font-bold rounded-2xl transition flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <span>??</span> Salir a Inicio (Home)
                </Link>

                <button
                  onClick={() => setShowSwitchModal(true)}
                  className="w-full py-3 bg-purple-950/40 hover:bg-purple-900/40 border border-purple-500/30 text-purple-300 font-bold rounded-2xl transition flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <span>??</span> Cambiar de Cuenta
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-300 font-bold rounded-2xl transition flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <span>??</span> Cerrar Sesión
                </button>

                {/* BOTÓN ELIMINAR CUENTA */}
                <button
                  onClick={handleDeleteAccount}
                  className="w-full py-3 bg-rose-950/60 hover:bg-rose-900 border border-rose-500/50 text-rose-300 font-extrabold rounded-2xl transition flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <span>???</span> Eliminar Cuenta
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* MODAL CAMBIAR DE CUENTA */}
        {showSwitchModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold font-serif text-white">Cambiar de Cuenta</h3>
                <button
                  onClick={() => setShowSwitchModal(false)}
                  className="text-slate-400 hover:text-white cursor-pointer text-sm font-bold"
                >
                  ?
                </button>
              </div>

              <div className="space-y-2">
                {accounts.map((acc) => (
                  <div
                    key={acc.id}
                    onClick={() => handleSwitchAccount(acc.id)}
                    className={
                      "p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition " +
                      (acc.isCurrent
                        ? "bg-amber-500/10 border-amber-500/40 text-white"
                        : "bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700")
                    }
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{acc.avatar}</span>
                      <div>
                        <h4 className="font-bold text-xs">{acc.name}</h4>
                        <p className="text-[10px] text-slate-400">{acc.email}</p>
                      </div>
                    </div>
                    {acc.isCurrent && (
                      <span className="text-[10px] bg-amber-500 text-slate-950 font-black px-2 py-0.5 rounded-full">
                        Activa
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

