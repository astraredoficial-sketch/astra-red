"use client";

import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { enableAndroidPushNotifications } from "@/lib/nativePush";
import { supabase } from "@/lib/supabase/client";

export function PushNotificationSettings() {
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const android =
      Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
    if (!android) return;

    let active = true;
    void PushNotifications.checkPermissions()
      .then(async (permission) => {
        if (!active || permission.receive !== "granted") return;
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();
        if (authError) throw authError;
        if (!user) return;

        const { data, error: deviceError } = await supabase
          .from("push_devices")
          .select("token")
          .eq("user_id", user.id)
          .limit(1)
          .maybeSingle();
        if (deviceError) throw deviceError;
        if (active && data) setEnabled(true);
      })
      .catch((cause: unknown) => {
        console.error("No se pudo comprobar el registro de notificaciones:", cause);
        if (active) setError("No se pudo comprobar el estado de las notificaciones.");
      });

    function handleReady() {
      setEnabled(true);
      setBusy(false);
      setError("");
      setMessage("Este dispositivo ya puede recibir avisos de AstraRed.");
    }
    function handleError(event: Event) {
      setBusy(false);
      setError(
        event instanceof CustomEvent && typeof event.detail === "string"
          ? event.detail
          : "No se pudieron activar las notificaciones en este dispositivo.",
      );
    }
    window.addEventListener("astrared:push-ready", handleReady);
    window.addEventListener("astrared:push-error", handleError);

    return () => {
      active = false;
      window.removeEventListener("astrared:push-ready", handleReady);
      window.removeEventListener("astrared:push-error", handleError);
    };
  }, []);

  async function enableNotifications() {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await enableAndroidPushNotifications();
      setMessage("Solicitud enviada. Estamos registrando este dispositivo.");
    } catch (cause) {
      setBusy(false);
      setError(
        cause instanceof Error
          ? cause.message
          : "No se pudieron activar las notificaciones.",
      );
    }
  }

  return (
    <section className="rounded-3xl border border-rose-400/25 bg-gradient-to-br from-rose-950/30 to-slate-900/80 p-6">
      <h2 className="font-serif text-xl">Avisos en tu dispositivo</h2>
      <p className="mt-2 text-sm leading-6 text-slate-300">
        Recibe avisos de mensajes nuevos, conexiones astrales destacadas y
        recordatorios de tu calendario.
      </p>
      <button
        type="button"
        onClick={() => void enableNotifications()}
        disabled={busy || enabled}
        className="mt-4 min-h-12 rounded-full bg-rose-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-400 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        {enabled
          ? "Notificaciones activadas en este dispositivo"
          : busy
            ? "Activando notificaciones..."
            : "Activar notificaciones en Android"}
      </button>
      <p className="mt-3 text-xs text-slate-400">
        Los avisos del sistema se activan desde la app AstraRed para Android.
        En la web también puedes consultar tu bandeja de notificaciones.
      </p>
      {message && (
        <p role="status" className="mt-3 text-sm text-emerald-300">
          {message}
        </p>
      )}
      {error && (
        <p role="alert" className="mt-3 text-sm text-rose-200">
          {error}
        </p>
      )}
    </section>
  );
}
