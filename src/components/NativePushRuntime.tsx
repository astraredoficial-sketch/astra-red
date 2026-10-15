"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import { PushNotifications } from "@capacitor/push-notifications";
import type { PluginListenerHandle } from "@capacitor/core";
import { supabase } from "@/lib/supabase/client";

export function NativePushRuntime() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== "android") {
      return;
    }

    let active = true;
    let userId: string | null = null;
    const listeners: PluginListenerHandle[] = [];

    async function registerIfAllowed() {
      const permission = await PushNotifications.checkPermissions();
      if (active && permission.receive === "granted") {
        await PushNotifications.register();
      }
    }

    async function setUser(nextUserId: string | null) {
      if (userId && userId !== nextUserId) {
        const token = window.localStorage.getItem("astrared:push-token");
        if (token) {
          const { error } = await supabase
            .from("push_devices")
            .delete()
            .eq("token", token)
            .eq("user_id", userId);
          if (error) {
            console.error("No se pudo desvincular el dispositivo al cerrar sesión:", error);
          }
          window.localStorage.removeItem("astrared:push-token");
        }
      }
      userId = nextUserId;
      if (userId) {
        await registerIfAllowed();
      }
    }

    async function start() {
      listeners.push(
        await PushNotifications.addListener("registration", async (token) => {
          if (!active || !userId) return;

          window.localStorage.setItem("astrared:push-token", token.value);
          const { error } = await supabase.from("push_devices").upsert(
            {
              token: token.value,
              user_id: userId,
              platform: "android",
              updated_at: new Date().toISOString(),
            },
            { onConflict: "token" },
          );
          if (error) {
            console.error("No se pudo registrar este dispositivo para avisos:", error);
            window.dispatchEvent(
              new CustomEvent("astrared:push-error", {
                detail: "No se pudo activar este dispositivo para recibir avisos.",
              }),
            );
            return;
          }
          window.dispatchEvent(new CustomEvent("astrared:push-ready"));
        }),
      );
      listeners.push(
        await PushNotifications.addListener("registrationError", (event) => {
          console.error("Falló el registro de notificaciones Android:", event);
          window.dispatchEvent(
            new CustomEvent("astrared:push-error", {
              detail: "Android no pudo registrar las notificaciones de este dispositivo.",
            }),
          );
        }),
      );
      listeners.push(
        await PushNotifications.addListener(
          "pushNotificationActionPerformed",
          ({ notification }) => {
            const href = notification.data?.href;
            if (
              typeof href === "string" &&
              href.startsWith("/") &&
              !href.startsWith("//")
            ) {
              window.location.assign(href);
            }
          },
        ),
      );
      listeners.push(
        await PushNotifications.addListener(
          "pushNotificationReceived",
          async (notification) => {
            if (!active || !notification.title || !notification.body) return;
            try {
              const permission = await LocalNotifications.checkPermissions();
              if (permission.display !== "granted") return;
              await LocalNotifications.schedule({
                notifications: [
                  {
                    id: Math.floor(Date.now() % 2_000_000_000),
                    title: notification.title,
                    body: notification.body,
                    schedule: { at: new Date(Date.now() + 300) },
                    channelId: "astrared-alerts",
                    extra: { href: notification.data?.href },
                  },
                ],
              });
            } catch (cause) {
              console.error("No se pudo mostrar el aviso recibido en primer plano:", cause);
            }
          },
        ),
      );
      listeners.push(
        await LocalNotifications.addListener(
          "localNotificationActionPerformed",
          ({ notification }) => {
            const href = notification.extra?.href;
            if (
              typeof href === "string" &&
              href.startsWith("/") &&
              !href.startsWith("//")
            ) {
              window.location.assign(href);
            }
          },
        ),
      );

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        window.setTimeout(() => {
          if (active) void setUser(session?.user.id ?? null);
        }, 0);
      });
      listeners.push({
        remove: async () => {
          subscription.unsubscribe();
        },
      });

      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.error("No se pudo comprobar la sesión para las notificaciones:", error);
        return;
      }
      await setUser(data.user?.id ?? null);
    }

    void start().catch((cause: unknown) => {
      console.error("No se pudieron iniciar las notificaciones Android:", cause);
    });

    return () => {
      active = false;
      for (const listener of listeners) void listener.remove();
    };
  }, []);

  return null;
}
