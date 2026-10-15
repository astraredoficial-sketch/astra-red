"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { StepWhere, type CityResult } from "@/components/StepWhere";
import { computeNatalChart } from "@/lib/astro/chart";
import { isAtLeastAge } from "@/lib/age";
import { supabase } from "@/lib/supabase/client";
import type { Gender, TargetGender } from "@/lib/types";

const TOTAL_STEPS = 4;

export default function OnboardingUi() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [authReady, setAuthReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [birthTimeUnknown, setBirthTimeUnknown] = useState(false);
  const [city, setCity] = useState<CityResult | null>(null);
  const [gender, setGender] = useState<Gender | "">("");
  const [targetGender, setTargetGender] = useState<TargetGender | "">("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function checkSession() {
      const { data, error: sessionError } = await supabase.auth.getUser();
      if (!active) return;

      if (sessionError || !data.user) {
        router.replace("/acceso?mode=signup");
        return;
      }

      const savedBirthDate = data.user.user_metadata?.birth_date;
      if (
        typeof savedBirthDate === "string" &&
        isAtLeastAge(savedBirthDate)
      ) {
        setBirthDate(savedBirthDate);
      }
      setAuthReady(true);
    }

    void checkSession();
    return () => {
      active = false;
    };
  }, [router]);

  function validateStep() {
    if (step === 1 && name.trim().length < 2) {
      setError("Escribe tu nombre para continuar.");
      return false;
    }
    if (step === 2) {
      if (!birthDate) {
        setError("Selecciona tu fecha de nacimiento.");
        return false;
      }
      if (!isAtLeastAge(birthDate)) {
        setError("AstraRed es para personas mayores de 18 años.");
        return false;
      }
      if (!birthTimeUnknown && !birthTime) {
        setError("Indica tu hora de nacimiento o marca que no la conoces.");
        return false;
      }
    }
    if (step === 3 && !city) {
      setError("Selecciona el país y una ciudad de nacimiento.");
      return false;
    }
    if (step === 4 && (!gender || !targetGender)) {
      setError("Completa tu identidad y a quién deseas conocer.");
      return false;
    }
    setError("");
    return true;
  }

  function goNext() {
    if (validateStep()) setStep((current) => current + 1);
  }

  async function handleFinish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validateStep()) return;
    if (step < TOTAL_STEPS) {
      setStep((current) => current + 1);
      return;
    }

    setLoading(true);
    setError("");
    let saveStage = "la carta natal";

    try {
      const { data, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!data.user) {
        throw new Error("Tu sesión expiró. Vuelve a iniciar sesión.");
      }
      if (!city || !gender || !targetGender) {
        throw new Error("Faltan datos obligatorios del formulario.");
      }

      const birth = {
        date: birthDate,
        time: birthTimeUnknown ? "12:00" : birthTime,
        cityId: city.id,
        timeUnknown: birthTimeUnknown,
        location: {
          latitude: city.latitude,
          longitude: city.longitude,
          timeZone: city.timeZone,
        },
      };
      const chart = computeNatalChart(birth);
      const now = new Date().toISOString();

      saveStage = "los datos de nacimiento";
      const { error: birthError } = await supabase.from("birth_details").upsert(
        {
          user_id: data.user.id,
          birth_date: birthDate,
          birth_time: birthTimeUnknown ? null : birthTime,
          birth_time_unknown: birthTimeUnknown,
          city_id: city.id,
          location_country: city.country,
          location_city: city.name,
          birth_latitude: city.latitude,
          birth_longitude: city.longitude,
          birth_timezone: city.timeZone,
          updated_at: now,
        },
        { onConflict: "user_id" },
      );
      if (birthError) throw birthError;

      saveStage = "el perfil";
      const { error: profileError } = await supabase.from("profiles").upsert(
        {
          id: data.user.id,
          name: name.trim(),
          gender,
          target_gender: targetGender,
          chart,
          updated_at: now,
        },
        { onConflict: "id" },
      );
      if (profileError) throw profileError;

      void supabase.functions
        .invoke("notify-new-message", {
          body: { event: "high-compatibility" },
        })
        .then(({ error: notificationError }) => {
          if (notificationError) {
            console.error(
              "No se pudo avisar sobre nuevas compatibilidades destacadas:",
              notificationError,
            );
          }
        });

      router.replace("/carta");
    } catch (cause) {
      const detail =
        cause instanceof Error
          ? cause.message
          : typeof cause === "object" &&
              cause !== null &&
              "message" in cause &&
              typeof cause.message === "string"
            ? cause.message
            : "Error desconocido al guardar tus datos.";
      setError(
        `No se pudo completar el registro durante ${saveStage}. Tus datos siguen en el formulario. ${detail}`,
      );
    } finally {
      setLoading(false);
    }
  }

  if (!authReady) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-950 px-4 text-slate-300">
        Verificando tu sesión...
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 p-4 font-sans text-slate-100">
      <form
        onSubmit={handleFinish}
        className="w-full max-w-lg space-y-6 rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-2xl sm:p-8"
      >
        <header className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-slate-400">
          <span>Paso {step} de {TOTAL_STEPS}</span>
          <span className="text-purple-400">AstraRed</span>
        </header>

        <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-amber-400 transition-all"
            style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
          />
        </div>

        {step === 1 && (
          <section className="space-y-4">
            <div>
              <h1 className="font-serif text-2xl font-bold text-white">
                ¿Qué nombre o apodo quieres usar?
              </h1>
              <p className="mt-1 text-sm text-slate-400">
                Usa el nombre con el que te gustaría aparecer. No hace falta que
                compartas tu nombre legal.
              </p>
            </div>
            <label
              htmlFor="profile-name"
              className="block text-sm text-slate-300"
            >
              Nombre o apodo
            </label>
            <input
              id="profile-name"
              autoComplete="name"
              maxLength={100}
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white focus:border-amber-500 focus:outline-none"
              placeholder="El nombre que verán los demás"
            />
          </section>
        )}

        {step === 2 && (
          <section className="space-y-4">
            <div>
              <h1 className="font-serif text-2xl font-bold text-white">
                Tu nacimiento
              </h1>
              <p className="mt-1 text-sm text-slate-400">
                La hora ayuda a calcular el ascendente y las casas.
              </p>
            </div>
            <label
              htmlFor="birth-date"
              className="block text-sm text-slate-300"
            >
              Fecha de nacimiento
            </label>
            <input
              id="birth-date"
              type="date"
              required
              value={birthDate}
              onChange={(event) => setBirthDate(event.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white"
            />
            <p className="-mt-2 text-xs leading-5 text-slate-400">
              La beta está disponible únicamente para personas mayores de 18
              años.
            </p>
            <label
              htmlFor="birth-time"
              className="block text-sm text-slate-300"
            >
              Hora de nacimiento
            </label>
            <input
              id="birth-time"
              type="time"
              required={!birthTimeUnknown}
              disabled={birthTimeUnknown}
              value={birthTime}
              onChange={(event) => setBirthTime(event.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white disabled:opacity-50"
            />
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={birthTimeUnknown}
                onChange={(event) =>
                  setBirthTimeUnknown(event.target.checked)
                }
                className="accent-amber-400"
              />
              No conozco mi hora de nacimiento
            </label>
          </section>
        )}

        {step === 3 && (
          <StepWhere
            onSelectCity={(selected) => {
              setCity(selected);
              setError("");
            }}
          />
        )}

        {step === 4 && (
          <section className="space-y-4">
            <div>
              <h1 className="font-serif text-2xl font-bold text-white">
                Preferencias de conexión
              </h1>
              <p className="mt-1 text-sm text-slate-400">
                Estas preferencias filtran los perfiles que verás en Destinos.
              </p>
            </div>
            <label
              htmlFor="profile-gender"
              className="block text-sm text-slate-300"
            >
              ¿Cómo te identificas?
            </label>
            <select
              id="profile-gender"
              required
              value={gender}
              onChange={(event) =>
                setGender(event.target.value as Gender | "")
              }
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white"
            >
              <option value="">Selecciona una opción</option>
              <option value="hombre">Hombre</option>
              <option value="mujer">Mujer</option>
              <option value="otro">Otro / prefiero no decirlo</option>
            </select>
            <label
              htmlFor="target-gender"
              className="block text-sm text-slate-300"
            >
              ¿A quién deseas conocer?
            </label>
            <select
              id="target-gender"
              required
              value={targetGender}
              onChange={(event) =>
                setTargetGender(event.target.value as TargetGender | "")
              }
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white"
            >
              <option value="">Selecciona una opción</option>
              <option value="hombre">Hombres</option>
              <option value="mujer">Mujeres</option>
              <option value="ambos">Ambos</option>
            </select>
          </section>
        )}

        {error && (
          <p role="alert" className="break-words text-sm leading-6 text-rose-300">
            {error}
          </p>
        )}

        <div className="flex gap-3 pt-2">
          {step > 1 && (
            <button
              type="button"
              disabled={loading}
              onClick={() => {
                setError("");
                setStep((current) => current - 1);
              }}
              className="flex-1 rounded-xl bg-slate-800 py-3 text-sm hover:bg-slate-700 disabled:opacity-50"
            >
              Atrás
            </button>
          )}
          {step < TOTAL_STEPS ? (
            <button
              type="button"
              onClick={goNext}
              className="flex-[2] rounded-xl bg-amber-400 py-3 text-sm font-bold text-slate-950 hover:bg-amber-300"
            >
              Siguiente
            </button>
          ) : (
            <button
              type="submit"
              disabled={loading}
              className="flex-[2] rounded-xl bg-amber-400 py-3 text-sm font-bold text-slate-950 hover:bg-amber-300 disabled:cursor-wait disabled:opacity-60"
            >
              {loading ? "Guardando y calculando..." : "Crear mi carta natal"}
            </button>
          )}
        </div>
      </form>
    </main>
  );
}
