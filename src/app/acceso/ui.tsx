"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";
import { supabase } from "@/lib/supabase/client";

type Mode = "login" | "signup";

export function AccesoUi() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [hasActiveSession, setHasActiveSession] = useState(false);

  useEffect(() => {
    let active = true;

    async function initialize() {
      const params = new URLSearchParams(window.location.search);
      const requestedMode: Mode =
        params.get("mode") === "signup" ? "signup" : "login";

      if (active) setMode(requestedMode);

      const { data, error: sessionError } = await supabase.auth.getSession();
      if (!active || sessionError || !data.session) return;

      // En login, no entrar automáticamente: la persona debe enviar el formulario.
      // En signup, avisar si ya hay una sesión abierta para evitar mezclar cuentas.
      if (requestedMode === "signup") {
        setHasActiveSession(true);
      }
    }

    void initialize();

    return () => {
      active = false;
    };
  }, [router]);

  async function continueForUser(userId: string) {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    if (profileError) throw profileError;
    router.replace(profile ? "/carta" : "/onboarding");
  }

  async function signOutToCreateAccount() {
    setBusy(true);
    setError("");
    setNotice("");

    try {
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) throw signOutError;

      setHasActiveSession(false);
      setNotice("Sesión cerrada. Ya puedes crear una cuenta independiente.");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "No se pudo cerrar la sesión actual."
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");

    if (mode === "signup" && hasActiveSession) {
      setError("Cierra la sesión actual antes de crear otra cuenta.");
      return;
    }

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes("@")) {
      setError("Escribe un correo electrónico válido.");
      return;
    }

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    setBusy(true);

    try {
      if (mode === "signup") {
        const { data, error: signupError } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/acceso`,
          },
        });

        if (signupError) throw signupError;

        if (data.session && data.user) {
          await continueForUser(data.user.id);
        } else {
          setNotice(
            "Cuenta creada. Revisa tu correo y confirma la dirección antes de iniciar sesión."
          );
        }
      } else {
        const { data, error: loginError } =
          await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password,
          });

        if (loginError) throw loginError;
        if (!data.user) throw new Error("No se pudo verificar la cuenta.");

        await continueForUser(data.user.id);
      }
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "No se pudo completar el acceso. Inténtalo de nuevo."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-full w-full max-w-md flex-col px-5 py-8">
      <BrandMark />

      <div className="mt-12">
        <p className="text-xs uppercase tracking-[0.3em] text-astral">
          Tu universo privado
        </p>

        <h1 className="mt-3 font-serif text-4xl">
          {mode === "login" ? "Vuelve a tu órbita." : "Encuentra tu hilo."}
        </h1>

        <p className="mt-3 text-sm leading-6 text-muted">
          {mode === "login"
            ? "Entra para continuar con tu carta natal y tus conexiones."
            : "Crea tu propia cuenta gratis y empieza a descubrir tu carta natal."}
        </p>
      </div>

      {hasActiveSession && mode === "signup" && (
        <section className="mt-6 rounded-2xl border border-astral/30 bg-white/5 p-4">
          <p className="text-sm leading-6 text-muted">
            Ya hay una cuenta abierta en este navegador. Para crear otra cuenta
            independiente, primero cierra esa sesión. No se borrará su carta natal.
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={() => void signOutToCreateAccount()}
            className="mt-4 w-full rounded-full border border-white/15 px-4 py-3 text-sm hover:bg-white/5 disabled:opacity-50"
          >
            {busy ? "Cerrando sesión..." : "Cerrar sesión y crear otra cuenta"}
          </button>
        </section>
      )}

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        <label className="text-sm text-muted" htmlFor="access-email">
          Correo electrónico
        </label>
        <input
          id="access-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 outline-none focus:ring-2 focus:ring-thread/40"
          placeholder="tu@correo.com"
        />

        <label className="text-sm text-muted" htmlFor="access-password">
          Contraseña
        </label>
        <input
          id="access-password"
          type="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          minLength={8}
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 outline-none focus:ring-2 focus:ring-thread/40"
          placeholder="Al menos 8 caracteres"
        />

        {error && (
          <p role="alert" className="break-words text-sm text-thread">
            {error}
          </p>
        )}

        {notice && (
          <p role="status" className="text-sm leading-6 text-astral">
            {notice}
          </p>
        )}

        <button
          type="submit"
          disabled={busy || (mode === "signup" && hasActiveSession)}
          className="glow-thread mt-2 rounded-full bg-thread px-6 py-3.5 text-sm font-medium text-white disabled:opacity-50"
        >
          {busy
            ? "Un momento..."
            : mode === "login"
              ? "Entrar"
              : "Crear cuenta gratis"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        {mode === "login" ? "¿Todavía no tienes cuenta?" : "¿Ya tienes cuenta?"}{" "}
        <button
          type="button"
          onClick={() => {
            setMode(mode === "login" ? "signup" : "login");
            setError("");
            setNotice("");
          }}
          className="text-thread underline underline-offset-4"
        >
          {mode === "login" ? "Crear cuenta" : "Iniciar sesión"}
        </button>
      </p>

      <Link
        href="/"
        className="mt-8 text-center text-sm text-muted hover:text-ink"
      >
        Volver al inicio
      </Link>
    </main>
  );
}