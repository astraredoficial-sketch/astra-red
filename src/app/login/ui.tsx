"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { getAllAccounts, saveAccounts } from "@/lib/userStore";

export function LoginUi() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isEmailUnconfirmed, setIsEmailUnconfirmed] = useState(false);
  const [resendStatus, setResendStatus] = useState("");
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash || window.location.search;
      if (hash.includes("otp_expired") || hash.includes("access_denied")) {
        setErrorMsg("⚠️ El enlace de verificación ha expirado. Ingresa tu correo para reenviar uno nuevo.");
        setIsEmailUnconfirmed(true);
      }
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setResendStatus("");
    setIsEmailUnconfirmed(false);

    const accounts = getAllAccounts();
    const cleanEmail = email.trim().toLowerCase();

    const matchedAccount = accounts.find(
      (acc) => acc.email.trim().toLowerCase() === cleanEmail
    );

    if (!matchedAccount) {
      setErrorMsg("⚠️ Esta cuenta no existe o fue eliminada.");
      return;
    }

    if (matchedAccount.password && matchedAccount.password !== password) {
      setErrorMsg("⚠️ Contraseña incorrecta.");
      return;
    }

    const updated = accounts.map((acc) => ({
      ...acc,
      isCurrent: acc.id === matchedAccount.id,
    }));
    saveAccounts(updated);

    if (matchedAccount.isComplete === false) {
      alert("⚠️ Tu registro está incompleto. Por favor termina de configurar tu ubicación y carta natal.");
      window.location.href = "/onboarding";
      return;
    }

    window.location.href = "/cuenta";
  };

  const handleResendConfirmation = async () => {
    if (!email.trim()) {
      setErrorMsg("Por favor escribe tu correo electrónico arriba.");
      return;
    }

    setIsResending(true);
    setResendStatus("");

    setTimeout(() => {
      setIsResending(false);
      setResendStatus("📩 ¡Enlace reenviado con éxito! Revisa tu bandeja de entrada o Spam.");
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-500 animate-pulse"></span>
            <span className="font-serif font-bold text-xl text-white">Astra<span className="text-rose-500">Red</span></span>
          </div>
          <span className="text-[10px] text-purple-400 font-bold uppercase tracking-widest font-mono block">
            TU UNIVERSO PRIVADO
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white">Vuelve a tu órbita.</h1>
          <p className="text-xs text-slate-400">Entra para continuar con tu carta natal y tus conexiones.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-950/80 border border-rose-500/50 rounded-2xl text-rose-200 text-xs text-center font-medium animate-in fade-in leading-relaxed space-y-2">
              <p>{errorMsg}</p>
            </div>
          )}

          {resendStatus && (
            <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-2xl text-emerald-200 text-xs text-center font-medium animate-in fade-in">
              {resendStatus}
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-300">Correo electrónico</label>
            <input
              type="email"
              required
              placeholder="tu@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-rose-500 transition font-medium"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-300">Contraseña</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-rose-500 transition font-medium"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-extrabold rounded-2xl transition shadow-xl text-sm cursor-pointer"
          >
            Entrar
          </button>

          {/* BOTÓN PARA REENVIAR CORREO DE CONFIRMACIÓN */}
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={handleResendConfirmation}
              disabled={isResending}
              className="text-xs text-amber-300 hover:text-amber-200 underline font-semibold transition cursor-pointer"
            >
              {isResending ? "Enviando correo..." : "📩 ¿No recibiste el correo? Reenviar enlace de confirmación"}
            </button>
          </div>
        </form>

        <div className="text-center space-y-2 text-xs">
          <p className="text-slate-400">
            ¿Todavía no tienes cuenta?{" "}
            <Link href="/onboarding" className="text-rose-400 hover:underline font-bold">
              Crear cuenta
            </Link>
          </p>
          <div>
            <Link href="/" className="text-slate-500 hover:text-slate-300 transition">
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
