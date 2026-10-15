"use client";

import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import { PushNotifications } from "@capacitor/push-notifications";

export async function enableAndroidPushNotifications() {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== "android") {
    throw new Error("Las notificaciones del sistema están disponibles en la app Android.");
  }

  let permission = await PushNotifications.checkPermissions();
  if (permission.receive !== "granted") {
    permission = await PushNotifications.requestPermissions();
  }
  if (permission.receive !== "granted") {
    throw new Error("Permite las notificaciones de AstraRed en los ajustes de Android.");
  }

  let localPermission = await LocalNotifications.checkPermissions();
  if (localPermission.display !== "granted") {
    localPermission = await LocalNotifications.requestPermissions();
  }
  if (localPermission.display !== "granted") {
    throw new Error("Permite las notificaciones de AstraRed en los ajustes de Android.");
  }

  await LocalNotifications.createChannel({
    id: "astrared-alerts",
    name: "Avisos de AstraRed",
    description: "Mensajes, afinidades y recordatorios astrales",
    importance: 4,
    visibility: 1,
    vibration: true,
  });
  await PushNotifications.register();
}
