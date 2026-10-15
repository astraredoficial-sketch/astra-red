"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";
import { isAtLeastAge } from "@/lib/age";
import { supabase } from "@/lib/supabase/client";

type Mode = "login" | "signup" | "recover" | "reset";

const EMAIL_CONFIRMATION_REDIRECT_URL =
  "https://astrared.vip/acceso?mode=login";
const PASSWORD_RECOVERY_REDIRECT_URL =
  "https://astrared.vip/acceso?mode=reset";

export function AccesoUi({
  initialMode,
}: {
  initialMode: "login" | "signup" | "reset";
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [birthDate, setBirthDate] = useState("");
  const [acceptedLegal, setAcceptedLegal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [hasActiveSession, setHasActiveSession] = useState(false);

  useEffect(() => {
    let active = true;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === "PASSWORD_RECOVERY") {
        setMode("reset");
        setError("");
        setNotice("");
        setHasActiveSession(Boolean(session));
      }
    });

    async function initialize() {
      const params = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.slice(1));
      const requestedMode = params.get("mode");
      const initialMode: Mode =
        requestedMode === "signup"
          ? "signup"
          : requestedMode === "reset" ||
              params.get("type") === "recovery" ||
              hashParams.get("type") === "recovery"
            ? "reset"
            : "login";

      if (active) setMode(initialMode);
      if (active && params.get("account") === "deleted") {
        setNotice("Tu cuenta fue eliminada y cerramos tu sesión.");
      }

      const { data, error: sessionError } = await supabase.auth.getSession();
      if (!active) return;
      if (sessionError) {
        setError(sessionError.message);
        return;
      }
      setHasActiveSession(Boolean(data.session));
    }

    void initialize();

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [router]);

  async function continueForUser(userId: string) {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("chart")
      .eq("id", userId)
      .maybeSingle();

    if (profileError) throw profileError;
    router.replace(profile?.chart ? "/carta" : "/onboarding");
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

    if (mode !== "reset" && (!cleanEmail || !cleanEmail.includes("@"))) {
      setError("Escribe un correo electrónico válido.");
      return;
    }

    if (mode !== "recover" && password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (mode === "reset" && password !== passwordConfirmation) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (mode === "signup" && !isAtLeastAge(birthDate)) {
      setError(
        birthDate
          ? "AstraRed es para personas mayores de 18 años."
          : "Selecciona tu fecha de nacimiento para continuar.",
      );
      return;
    }
    if (mode === "signup" && !acceptedLegal) {
      setError("Acepta los términos y la política de privacidad para continuar.");
      return;
    }
    setBusy(true);

    try {
      if (mode === "signup") {
        const { data, error: signupError } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            emailRedirectTo: EMAIL_CONFIRMATION_REDIRECT_URL,
            data: {
              birth_date: birthDate,
              accepted_terms_at: new Date().toISOString(),
            },
          },
        });

        if (signupError) throw signupError;

        if (data.session && data.user) {
          router.replace("/onboarding");
        } else {
          setNotice(
            "Cuenta creada. Revisa tu correo y confirma la dirección antes de iniciar sesión."
          );
        }
      } else if (mode === "recover") {
        const { error: recoveryError } =
          await supabase.auth.resetPasswordForEmail(cleanEmail, {
            redirectTo: PASSWORD_RECOVERY_REDIRECT_URL,
          });

        if (recoveryError) throw recoveryError;
        setNotice(
          "Si existe una cuenta asociada a ese correo, recibirás un enlace para recuperar tu contraseña."
        );
      } else if (mode === "reset") {
        const { data, error: updateError } = await supabase.auth.updateUser({
          password,
        });

        if (updateError) throw updateError;
        if (!data.user) throw new Error("No se pudo actualizar la contraseña.");

        await continueForUser(data.user.id);
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
    <main className="starfield relative min-h-screen overflow-hidden bg-[#07060c] text-ink">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 py-8">
        <BrandMark />

        <div className="mt-12">
          <p className="text-xs uppercase tracking-[0.3em] text-astral">
            Tu universo privado
          </p>

          <h1 className="mt-3 font-serif text-4xl">
            {mode === "login"
              ? "Vuelve a tu órbita."
              : mode === "signup"
                ? "Encuentra tu hilo."
                : mode === "recover"
                  ? "Recupera tu acceso."
                  : "Crea una nueva contraseña."}
          </h1>

          <p className="mt-3 text-sm leading-6 text-muted">
            {mode === "login"
              ? "Entra para continuar con tu carta natal y tus conexiones."
              : mode === "signup"
                ? "Crea tu propia cuenta GRATIS y empieza a descubrir tu carta natal."
                : mode === "recover"
                  ? "Te enviaremos un enlace para que puedas volver a entrar."
                  : "Elige una contraseña nueva para proteger tu cuenta."}
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
          {mode !== "reset" && (
            <div className="flex flex-col gap-2">
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
            </div>
          )}

          {mode !== "recover" && (
            <div className="flex flex-col gap-2">
              <label className="text-sm text-muted" htmlFor="access-password">
                {mode === "reset" ? "Nueva contraseña" : "Contraseña"}
              </label>
              <div className="relative">
                <input
                  id="access-password"
                  type={passwordVisible ? "text" : "password"}
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
                  minLength={8}
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 pr-14 outline-none focus:ring-2 focus:ring-thread/40"
                  placeholder="Al menos 8 caracteres"
                />
                <button
                  type="button"
                  onClick={() => setPasswordVisible((visible) => !visible)}
                  aria-label={
                    passwordVisible
                      ? mode === "reset"
                        ? "Ocultar contraseñas"
                        : "Ocultar contraseña"
                      : mode === "reset"
                        ? "Mostrar contraseñas"
                        : "Mostrar contraseña"
                  }
                  aria-pressed={passwordVisible}
                  className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-muted outline-none transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-thread"
                >
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5"
                  >
                    <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
                    <circle cx="12" cy="12" r="2.5" />
                    {passwordVisible && <path d="m4 4 16 16" />}
                  </svg>
                </button>
              </div>
            </div>
          )}

          {mode === "login" && (
            <button
              type="button"
              onClick={() => {
                setMode("recover");
                setError("");
                setNotice("");
                setPasswordVisible(false);
              }}
              className="-mt-2 min-h-11 self-end text-sm text-thread underline underline-offset-4"
            >
              ¿Olvidaste tu contraseña?
            </button>
          )}

          {mode === "reset" && (
            <div className="flex flex-col gap-2">
              <label
                className="text-sm text-muted"
                htmlFor="access-password-confirmation"
              >
                Confirma la nueva contraseña
              </label>
              <input
                id="access-password-confirmation"
                type={passwordVisible ? "text" : "password"}
                autoComplete="new-password"
                minLength={8}
                required
                value={passwordConfirmation}
                onChange={(event) => setPasswordConfirmation(event.target.value)}
                className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 outline-none focus:ring-2 focus:ring-thread/40"
                placeholder="Repite la nueva contraseña"
              />
            </div>
          )}

        {mode === "signup" && (
          <>
            <label className="text-sm text-muted" htmlFor="access-birth-date">
              Fecha de nacimiento
            </label>
            <input
              id="access-birth-date"
              type="date"
              autoComplete="bday"
              required
              value={birthDate}
              onChange={(event) => setBirthDate(event.target.value)}
              className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-white outline-none focus:ring-2 focus:ring-thread/40"
            />
            <p className="-mt-2 text-xs leading-5 text-muted">
              AstraRed es una beta para personas mayores de 18 años. Tu fecha
              también se usará para tu carta natal.
            </p>
            <label className="flex items-start gap-3 text-sm leading-5 text-muted">
              <input
                type="checkbox"
                checked={acceptedLegal}
                onChange={(event) => setAcceptedLegal(event.target.checked)}
                className="mt-1 accent-thread"
              />
              <span>
                Confirmo que tengo 18 años o más y acepto los{" "}
                <Link
                  href="/terminos"
                  target="_blank"
                  className="text-thread underline underline-offset-4"
                >
                  términos de uso
                </Link>{" "}
                y la{" "}
                <Link
                  href="/privacidad"
                  target="_blank"
                  className="text-thread underline underline-offset-4"
                >
                  política de privacidad
                </Link>
                .
              </span>
            </label>
          </>
        )}

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
          disabled={
            busy ||
            (mode === "signup" &&
              (hasActiveSession || !birthDate || !acceptedLegal))
          }
          className="glow-thread mt-2 rounded-full bg-thread px-6 py-3.5 text-sm font-medium text-white disabled:opacity-50"
        >
          {busy
            ? "Un momento..."
            : mode === "login"
              ? "Entrar"
              : mode === "signup"
                ? "Crear cuenta GRATIS"
                : mode === "recover"
                  ? "Enviar enlace de recuperación"
                  : "Guardar nueva contraseña"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        {mode === "login" || mode === "signup" ? (
          <>
            {mode === "login"
              ? "¿Todavía no tienes cuenta?"
              : "¿Ya tienes cuenta?"}{" "}
            <button
              type="button"
              onClick={() => {
                setMode(mode === "login" ? "signup" : "login");
                setError("");
                setNotice("");
                setPasswordVisible(false);
              }}
              className="text-thread underline underline-offset-4"
            >
              {mode === "login" ? "Crear cuenta" : "Iniciar sesión"}
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setError("");
              setNotice("");
              setPasswordVisible(false);
            }}
            className="text-thread underline underline-offset-4"
          >
            Volver a iniciar sesión
          </button>
        )}
      </p>

      <Link
        href="/"
        className="mt-8 text-center text-sm text-muted hover:text-ink"
      >
        Volver al inicio
      </Link>
      </div>
    </main>
  );
}
