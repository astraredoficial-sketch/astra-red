"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AppNav } from "@/components/AppNav";
import { PushNotificationSettings } from "@/components/PushNotificationSettings";
import { useSession } from "@/hooks/useSession";
import { supabase } from "@/lib/supabase/client";
import { isMissingAuthSessionError } from "@/lib/supabase/session";

const MAX_PHOTO_SIZE = 4 * 1024 * 1024;
const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

function clearLocalAccountData(userId: string) {
  try {
    const rawProfiles = localStorage.getItem("astrared:profiles:v2");
    if (rawProfiles) {
      const profiles: unknown = JSON.parse(rawProfiles);
      if (Array.isArray(profiles)) {
        localStorage.setItem(
          "astrared:profiles:v2",
          JSON.stringify(
            profiles.filter(
              (profile) =>
                profile &&
                typeof profile === "object" &&
                !("id" in profile && profile.id === userId),
            ),
          ),
        );
      } else if (profiles && typeof profiles === "object") {
        const store = profiles as Record<string, unknown>;
        if (Array.isArray(store.profiles)) {
          store.profiles = store.profiles.filter(
            (profile) =>
              profile &&
              typeof profile === "object" &&
              !("id" in profile && profile.id === userId),
          );
        }
        if (store.currentUserId === userId) delete store.currentUserId;
        localStorage.setItem("astrared:profiles:v2", JSON.stringify(store));
      }
    }

    localStorage.removeItem("astrared:swipes:v1");

    const rawMessages = localStorage.getItem("astrared:chat:v1");
    if (rawMessages) {
      const messages: unknown = JSON.parse(rawMessages);
      if (Array.isArray(messages)) {
        localStorage.setItem(
          "astrared:chat:v1",
          JSON.stringify(
            messages.filter(
              (message) =>
                message &&
                typeof message === "object" &&
                !(
                  "senderId" in message &&
                  message.senderId === userId
                ) &&
                !(
                  "recipientId" in message &&
                  message.recipientId === userId
                ),
            ),
          ),
        );
      }
    }

    const rawAccounts = localStorage.getItem("astra_accounts");
    if (rawAccounts) {
      const accounts: unknown = JSON.parse(rawAccounts);
      if (Array.isArray(accounts)) {
        localStorage.setItem(
          "astra_accounts",
          JSON.stringify(
            accounts
              .filter(
                (account) =>
                  account &&
                  typeof account === "object" &&
                  !("id" in account && account.id === userId),
              )
              .map((account) => ({ ...account, isCurrent: false })),
          ),
        );
      }
    }
  } catch (cause) {
    console.error("No se pudieron limpiar todos los datos locales de la cuenta:", cause);
  }
}

export function CuentaUi() {
  const router = useRouter();
  const { ready, store, me, error: sessionError, refresh } = useSession();
  const [email, setEmail] = useState("");
  const [signingOut, setSigningOut] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const avatarUrl = me?.avatarUrl ?? null;

  useEffect(() => {
    if (!ready || sessionError || me) return;
    router.replace(store?.currentUserId ? "/onboarding" : "/acceso?mode=login");
  }, [me, ready, router, sessionError, store?.currentUserId]);

  useEffect(() => {
    let active = true;

    async function loadEmail() {
      const { data, error: userError } = await supabase.auth.getUser();
      if (!active) return;
      if (userError) {
        if (isMissingAuthSessionError(userError)) {
          setEmail("");
          return;
        }
        setError(`No se pudo cargar tu cuenta: ${userError.message}`);
        return;
      }
      setEmail(data.user?.email ?? "");
    }

    void loadEmail();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!cameraStream || !video) return;

    video.srcObject = cameraStream;
    void video.play().catch((cause: unknown) => {
      setError(
        `No se pudo iniciar la vista de cámara: ${
          cause instanceof Error ? cause.message : "error desconocido"
        }`,
      );
    });

    return () => {
      cameraStream.getTracks().forEach((track) => track.stop());
      video.srcObject = null;
    };
  }, [cameraStream]);

  function closeCamera() {
    setCameraStream(null);
  }

  async function uploadPhoto(file: File) {
    setError("");
    setNotice("");

    if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
      setError("Elige una imagen JPG, PNG o WebP.");
      return;
    }
    if (file.size > MAX_PHOTO_SIZE) {
      setError("La imagen no puede superar los 4 MB.");
      return;
    }

    setUploadingPhoto(true);
    let uploadedPath: string | null = null;

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user || !me || user.id !== me.id) {
        throw new Error("Tu sesión ha cambiado. Vuelve a iniciar sesión.");
      }

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session?.access_token || session.user.id !== user.id) {
        throw new Error("Tu sesión ha expirado. Inicia sesión de nuevo.");
      }

      const uploadResponse = await fetch("/api/profile-photo", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": file.type,
        },
        body: file,
      });
      const uploadResult: unknown = await uploadResponse.json();
      if (
        !uploadResponse.ok ||
        !uploadResult ||
        typeof uploadResult !== "object" ||
        !("path" in uploadResult) ||
        typeof uploadResult.path !== "string"
      ) {
        const responseError =
          uploadResult &&
          typeof uploadResult === "object" &&
          "error" in uploadResult &&
          typeof uploadResult.error === "string"
            ? uploadResult.error
            : "No se pudo procesar la foto.";
        throw new Error(responseError);
      }
      uploadedPath = uploadResult.path;

      const { data: updatedProfile, error: updateError } = await supabase
        .from("profiles")
        .update({
          avatar_url: uploadedPath,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)
        .select("id")
        .maybeSingle();
      if (updateError) throw updateError;
      if (!updatedProfile) throw new Error("No se pudo actualizar tu perfil.");

      refresh();
      setNotice("Foto de perfil actualizada.");
    } catch (cause) {
      let message =
        cause instanceof Error ? cause.message : "No se pudo guardar la foto de perfil.";
      if (uploadedPath) {
        const { error: cleanupError } = await supabase.storage
          .from("profile-photos")
          .remove([uploadedPath]);
        if (cleanupError) {
          message += ` Además, no se pudo limpiar la imagen temporal: ${cleanupError.message}`;
        }
      }
      setError(message);
    } finally {
      setUploadingPhoto(false);
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) void uploadPhoto(file);
  }

  async function startCamera() {
    setError("");
    setNotice("");

    if (!navigator.mediaDevices?.getUserMedia) {
      cameraInputRef.current?.click();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: "user" } },
      });
      setCameraStream(stream);
    } catch (cause) {
      setError(
        `No se pudo acceder a la cámara: ${
          cause instanceof Error ? cause.message : "revisa los permisos del navegador"
        }`,
      );
    }
  }

  function capturePhoto() {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) {
      setError("La cámara aún no está lista. Espera un momento e inténtalo de nuevo.");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    if (!context) {
      setError("No se pudo preparar la foto. Inténtalo de nuevo.");
      return;
    }
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (!blob) {
        setError("No se pudo crear la foto. Inténtalo de nuevo.");
        return;
      }
      closeCamera();
      void uploadPhoto(new File([blob], "foto-perfil.jpg", { type: "image/jpeg" }));
    }, "image/jpeg", 0.9);
  }

  async function handleSignOut() {
    setSigningOut(true);
    setError("");

    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      setError(`No se pudo cerrar la sesión: ${signOutError.message}`);
      setSigningOut(false);
      return;
    }

    router.replace("/");
    router.refresh();
  }

  async function handleDeleteAccount() {
    if (!me || deleteConfirmation !== "ELIMINAR" || deletingAccount) return;

    setDeletingAccount(true);
    setError("");
    setNotice("");

    try {
      const { data, error: deleteError } = await supabase.functions.invoke(
        "delete-account",
      );
      if (deleteError) throw deleteError;
      if (data?.success !== true) {
        throw new Error(
          "El servidor no confirmó la eliminación. Inténtalo de nuevo.",
        );
      }
    } catch (cause) {
      setError(
        `No se pudo eliminar la cuenta: ${
          cause instanceof Error
            ? cause.message
            : "Error inesperado. Inténtalo de nuevo."
        }`,
      );
      setDeletingAccount(false);
      return;
    }

    setDeleteDialogOpen(false);
    clearLocalAccountData(me.id);
    try {
      const { error: signOutError } = await supabase.auth.signOut({
        scope: "local",
      });
      if (signOutError) {
        console.error(
          "La cuenta se eliminó, pero no se limpió la sesión local:",
          signOutError,
        );
      }
    } catch (cause) {
      console.error(
        "La cuenta se eliminó, pero no se pudo cerrar la sesión local:",
        cause,
      );
    } finally {
      window.location.replace("/acceso?mode=login&account=deleted");
    }
  }

  if (!ready || (!me && !sessionError)) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-950 text-slate-300">
        Cargando tu cuenta...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-white">
      <AppNav active="cuenta" />
      <main className="mx-auto w-full max-w-3xl flex-1 space-y-6 px-4 py-8 sm:px-6">
        <header>
          <p className="text-xs uppercase tracking-[0.25em] text-astral">
            Tu universo privado
          </p>
          <h1 className="mt-2 font-serif text-3xl">Mi cuenta</h1>
        </header>

        {sessionError && (
          <p role="alert" className="text-sm text-rose-300">
            {sessionError}
          </p>
        )}
        {error && (
          <p role="alert" className="text-sm text-rose-300">
            {error}
          </p>
        )}
        {notice && (
          <p role="status" className="text-sm text-emerald-300">
            {notice}
          </p>
        )}

        {me && (
          <>
            <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-center gap-4">
                  <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-full border border-amber-300/50 bg-slate-800 text-2xl text-amber-200">
                    {avatarUrl ? (
                      <Image
                        src={avatarUrl}
                        alt={`Foto de perfil de ${me.name}`}
                        width={80}
                        height={80}
                        unoptimized
                        className="size-20 object-cover"
                      />
                    ) : (
                      me.name.trim().charAt(0).toUpperCase() || "A"
                    )}
                  </div>
                  <div className="min-w-0">
                    <span className="rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-xs font-semibold text-amber-300">
                      Plan gratuito
                    </span>
                    <h2 className="mt-4 font-serif text-2xl">{me.name}</h2>
                    <p className="mt-1 text-sm text-slate-400">{email}</p>
                  </div>
                </div>
                <svg
                  aria-hidden="true"
                  className="size-8 shrink-0 text-amber-300"
                  fill="none"
                  viewBox="0 0 32 32"
                  stroke="currentColor"
                  strokeWidth="1.2"
                >
                  <circle cx="16" cy="16" r="10" />
                  <circle cx="16" cy="16" r="3" />
                  <path
                    strokeLinecap="round"
                    d="M16 2v5M16 25v5M2 16h5M25 16h5M6 6l3.5 3.5M22.5 22.5 26 26M26 6l-3.5 3.5M9.5 22.5 6 26"
                  />
                </svg>
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={uploadingPhoto}
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-medium transition hover:bg-white/5 disabled:cursor-wait disabled:opacity-50"
                >
                  {uploadingPhoto ? "Subiendo foto..." : "Elegir foto"}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  disabled={uploadingPhoto}
                  onChange={handleFileChange}
                  className="sr-only"
                  aria-label="Elegir foto desde tus archivos"
                />
                <button
                  type="button"
                  disabled={uploadingPhoto}
                  onClick={() => void startCamera()}
                  className="rounded-full border border-amber-300/40 bg-amber-300/10 px-5 py-2.5 text-sm font-medium text-amber-200 transition hover:bg-amber-300/20 disabled:cursor-wait disabled:opacity-50"
                >
                  Tomar una foto
                </button>
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="user"
                  disabled={uploadingPhoto}
                  onChange={handleFileChange}
                  className="sr-only"
                  aria-label="Tomar foto con la cámara del dispositivo"
                />
                <p className="self-center text-xs text-slate-400">
                  JPG, PNG o WebP · máximo 4 MB. El servidor elimina sus
                  metadatos antes de guardarla. Visible para personas con sesión
                  en AstraRed.
                </p>
              </div>
            </section>

            <PushNotificationSettings />

            <section className="overflow-hidden rounded-3xl border border-amber-400/40 bg-gradient-to-r from-amber-500/15 via-purple-900/30 to-slate-900 p-6 shadow-xl shadow-amber-950/20">
              <div className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
                <div>
                  <span className="rounded-full bg-amber-400 px-3 py-1 text-xs font-bold uppercase tracking-wide text-slate-950">
                    Calendario astral
                  </span>
                  <h2 className="mt-3 font-serif text-2xl">
                    Tu universo astral, más cerca
                  </h2>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
                    Explora las fases lunares y encuentra fechas alineadas con
                    tus planes: hogar, vehículos, viajes, amor y proyectos.
                  </p>
                  <ul className="mt-4 max-w-2xl space-y-2 text-sm leading-6 text-slate-300">
                    <li>
                      <span className="mr-2 font-bold text-amber-300" aria-hidden="true">✦</span>
                      Planifica momentos importantes con recomendaciones
                      astrológicas.
                    </li>
                    <li>
                      <span className="mr-2 font-bold text-amber-300" aria-hidden="true">✦</span>
                      Crea alertas automáticas para recordar las fechas que
                      elijas.
                    </li>
                    <li>
                      <span className="mr-2 font-bold text-amber-300" aria-hidden="true">✦</span>
                      Descubre el Hilo Rojo: recibe una alerta especial cuando
                      tú y otra persona alcancen 100% de compatibilidad astral.
                    </li>
                  </ul>
                  <p className="mt-3 text-xs text-slate-400">
                    La promoción de inauguración incluye un mes sin costo.
                    Después, el Calendario astral y Hilo Rojo requerirán VIP:
                    USD 4.99/mes o USD 34.99/año. No se activará una compra sin
                    tu aceptación expresa.
                  </p>
                </div>
                <Link
                  href="/calendario"
                  className="shrink-0 rounded-full bg-gradient-to-r from-amber-300 via-amber-400 to-rose-400 px-6 py-3 text-center text-sm font-extrabold text-slate-950 shadow-lg shadow-amber-950/30 transition hover:scale-[1.02] hover:brightness-110"
                >
                  Probar calendario
                </Link>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
              <h2 className="font-serif text-xl">Preferencias de conexión</h2>
              <p className="mt-3 text-sm text-slate-300">
                Identidad: {me.gender} · Desea conocer: {me.targetGender}
              </p>
              <p className="mt-1 text-sm text-slate-400">
                Tus datos de nacimiento se mantienen privados y se usan para
                calcular la carta y la compatibilidad.
              </p>
            </section>
          </>
        )}

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/carta"
            className="flex-1 rounded-full border border-white/15 px-5 py-3 text-center text-sm hover:bg-white/5 sm:flex-initial"
          >
            Ver mi carta natal
          </Link>
          <Link
            href="/onboarding"
            className="flex-1 rounded-full border border-white/15 px-5 py-3 text-center text-sm hover:bg-white/5 sm:flex-initial"
          >
            Actualizar datos y carta
          </Link>
          <div className="flex flex-1 gap-3">
            <button
              type="button"
              disabled={signingOut}
              onClick={() => void handleSignOut()}
              className="flex-1 rounded-full bg-thread px-5 py-3 text-sm font-medium text-white disabled:opacity-50"
            >
              {signingOut ? "Cerrando sesión..." : "Cerrar sesión"}
            </button>
            <button
              type="button"
              disabled={deletingAccount}
              onClick={() => {
                setError("");
                setDeleteConfirmation("");
                setDeleteDialogOpen(true);
              }}
              className="flex-1 rounded-full border border-rose-500/60 px-5 py-3 text-sm font-medium text-rose-200 transition hover:bg-rose-950/50 disabled:opacity-50"
            >
              Eliminar Cuenta
            </button>
          </div>
        </div>
      </main>
      {deleteDialogOpen && (
        <div
          className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-950/90 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-account-title"
        >
          <section className="w-full max-w-lg space-y-5 rounded-3xl border border-rose-500/40 bg-slate-900 p-6 shadow-2xl sm:p-8">
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-rose-300">
                Acción permanente
              </p>
              <h2
                id="delete-account-title"
                className="font-serif text-2xl font-bold text-white"
              >
                ¿Eliminar definitivamente tu cuenta?
              </h2>
              <p className="text-sm leading-6 text-slate-300">
                Se borrarán tu perfil, carta natal, datos de nacimiento,
                conexiones, mensajes, calendario astral, membresía VIP y fotos.
                No se puede deshacer. Para volver a usar AstraRed tendrás que
                registrarte de nuevo.
              </p>
            </div>
            <label className="block space-y-2 text-sm text-slate-200">
              Escribe <strong className="text-rose-200">ELIMINAR</strong> para
              confirmar
              <input
                autoComplete="off"
                value={deleteConfirmation}
                onChange={(event) => setDeleteConfirmation(event.target.value)}
                disabled={deletingAccount}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-rose-400"
              />
            </label>
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={deletingAccount}
                onClick={() => setDeleteDialogOpen(false)}
                className="rounded-full border border-white/15 px-5 py-3 text-sm text-slate-200 hover:bg-white/5 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={
                  deletingAccount || deleteConfirmation !== "ELIMINAR"
                }
                onClick={() => void handleDeleteAccount()}
                className="rounded-full bg-rose-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deletingAccount
                  ? "Eliminando cuenta..."
                  : "Eliminar permanentemente"}
              </button>
            </div>
          </section>
        </div>
      )}
      {cameraStream && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-slate-950/90 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="camera-title"
        >
          <div className="w-full max-w-lg rounded-3xl border border-amber-300/30 bg-slate-900 p-5 shadow-2xl">
            <h2 id="camera-title" className="font-serif text-2xl text-amber-100">
              Toma tu foto de perfil
            </h2>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="mt-4 aspect-[4/3] w-full rounded-2xl bg-black object-cover"
            />
            <div className="mt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeCamera}
                className="rounded-full border border-white/15 px-5 py-2.5 text-sm hover:bg-white/5"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={capturePhoto}
                className="rounded-full bg-thread px-5 py-2.5 text-sm font-semibold text-white"
              >
                Capturar y guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
