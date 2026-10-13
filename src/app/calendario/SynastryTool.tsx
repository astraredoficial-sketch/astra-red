"use client";

import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { Directory, Filesystem } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { StepWhere, type CityResult } from "@/components/StepWhere";
import { computeNatalChart } from "@/lib/astro/chart";
import { computeSynastry } from "@/lib/astro/synastry";
import { createSynastryShareCard } from "@/lib/astro/synastry-share-card";
import { ASPECT_META, PLANET_META } from "@/lib/astro/constants";
import { supabase } from "@/lib/supabase/client";
import type {
  AspectName,
  PlanetId,
  SynastryResult,
  UserProfile,
} from "@/lib/types";

type SynastryEntry = {
  id: string;
  otherName: string;
  result: SynastryResult;
  createdAt: string;
};

const HISTORY_COLUMNS = "id, user_id, other_name, result, created_at";
const PLANET_IDS = new Set<PlanetId>([
  "sun",
  "moon",
  "mercury",
  "venus",
  "mars",
  "jupiter",
  "saturn",
  "uranus",
  "neptune",
  "pluto",
  "node",
  "asc",
]);
const ASPECT_NAMES = new Set<AspectName>([
  "conjunction",
  "sextile",
  "square",
  "trine",
  "opposition",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isSynastryResult(value: unknown): value is SynastryResult {
  if (!isRecord(value) || !Array.isArray(value.aspects)) return false;
  return (
    typeof value.percent === "number" &&
    Number.isInteger(value.percent) &&
    value.percent >= 0 &&
    value.percent <= 100 &&
    typeof value.hasNodalAspect === "boolean" &&
    typeof value.hiloRojo === "boolean" &&
    typeof value.timeApproximate === "boolean" &&
    value.aspects.every(
      (aspect) =>
        isRecord(aspect) &&
        typeof aspect.a === "string" &&
        PLANET_IDS.has(aspect.a as PlanetId) &&
        typeof aspect.b === "string" &&
        PLANET_IDS.has(aspect.b as PlanetId) &&
        typeof aspect.type === "string" &&
        ASPECT_NAMES.has(aspect.type as AspectName) &&
        typeof aspect.orb === "number" &&
        Number.isFinite(aspect.orb) &&
        typeof aspect.exactAngle === "number" &&
        Number.isFinite(aspect.exactAngle),
    )
  );
}

function toSynastryEntry(value: unknown): SynastryEntry | null {
  if (!isRecord(value) || !isSynastryResult(value.result)) return null;
  if (
    typeof value.id !== "string" ||
    typeof value.other_name !== "string" ||
    !value.other_name.trim() ||
    typeof value.created_at !== "string" ||
    !Number.isFinite(Date.parse(value.created_at))
  ) {
    return null;
  }
  return {
    id: value.id,
    otherName: value.other_name,
    result: value.result,
    createdAt: value.created_at,
  };
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error("No se pudo preparar la imagen para compartir."));
        return;
      }
      const separator = reader.result.indexOf(",");
      if (separator < 0) {
        reject(new Error("El formato de la imagen generada no es válido."));
        return;
      }
      resolve(reader.result.slice(separator + 1));
    };
    reader.onerror = () =>
      reject(reader.error ?? new Error("No se pudo leer la imagen generada."));
    reader.readAsDataURL(blob);
  });
}

function formatHistoryDate(value: string): string {
  return new Intl.DateTimeFormat("es", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

type SynastryToolProps = {
  me: UserProfile;
};

export function SynastryTool({ me }: SynastryToolProps) {
  const [otherName, setOtherName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [city, setCity] = useState<CityResult | null>(null);
  const [history, setHistory] = useState<SynastryEntry[]>([]);
  const [historyOwnerId, setHistoryOwnerId] = useState("");
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState("");
  const [actionError, setActionError] = useState("");
  const [preview, setPreview] = useState<Omit<SynastryEntry, "id" | "createdAt"> | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [sharingId, setSharingId] = useState("");
  const [shareNotice, setShareNotice] = useState("");
  const [shareError, setShareError] = useState("");

  useEffect(() => {
    let active = true;
    const userId = me.id;

    async function loadHistory() {
      setHistoryLoading(true);
      setHistoryError("");
      const { data, error } = await supabase
        .from("synastry_history")
        .select(HISTORY_COLUMNS)
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (!active) return;
      if (error) {
        setHistoryError(`No se pudo cargar el historial: ${error.message}`);
        setHistoryOwnerId(userId);
        setHistoryLoading(false);
        return;
      }

      const entries = (data ?? [])
        .map(toSynastryEntry)
        .filter((entry): entry is SynastryEntry => entry !== null);
      setHistory(entries);
      setHistoryOwnerId(userId);
      if (entries.length !== (data ?? []).length) {
        setHistoryError("Algunos registros tienen datos inválidos y no se mostraron.");
      }
      setHistoryLoading(false);
    }

    void loadHistory();
    return () => {
      active = false;
    };
  }, [me.id]);

  async function calculateSynastry(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setActionError("");
    setShareNotice("");
    setPreview(null);

    const name = otherName.trim();
    if (!name || name.length > 80) {
      setActionError("Escribe un nombre de hasta 80 caracteres.");
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
      setActionError("Selecciona una fecha de nacimiento válida.");
      return;
    }
    const parsedDate = new Date(`${birthDate}T00:00:00Z`);
    if (
      Number.isNaN(parsedDate.getTime()) ||
      parsedDate.toISOString().slice(0, 10) !== birthDate ||
      parsedDate.getTime() > Date.now()
    ) {
      setActionError("La fecha de nacimiento no es válida.");
      return;
    }
    if (!city) {
      setActionError("Selecciona la localidad de nacimiento.");
      return;
    }

    setCalculating(true);
    try {
      const otherChart = computeNatalChart({
        date: birthDate,
        time: birthTime || "12:00",
        cityId: city.id,
        timeUnknown: !birthTime,
        location: {
          latitude: city.latitude,
          longitude: city.longitude,
          timeZone: city.timeZone,
        },
      });
      const result = computeSynastry(me.chart, otherChart);
      setPreview({ otherName: name, result });

      const { data, error } = await supabase
        .from("synastry_history")
        .insert({
          user_id: me.id,
          other_name: name,
          result,
        })
        .select(HISTORY_COLUMNS)
        .single();

      if (error) {
        setActionError(`Se calculó la sinastría, pero no se pudo guardar: ${error.message}`);
        return;
      }

      const entry = toSynastryEntry(data);
      if (!entry) {
        setActionError("Supabase guardó la sinastría con datos inválidos.");
        return;
      }

      setHistory((current) => [entry, ...current]);
      setPreview(null);
    } catch (cause) {
      setActionError(
        cause instanceof Error
          ? `No se pudo calcular la carta: ${cause.message}`
          : "No se pudo calcular la carta natal.",
      );
    } finally {
      setCalculating(false);
    }
  }

  async function deleteEntry(id: string) {
    setDeletingId(id);
    setHistoryError("");
    const { data, error } = await supabase
      .from("synastry_history")
      .delete()
      .eq("id", id)
      .eq("user_id", me.id)
      .select("id")
      .maybeSingle();
    setDeletingId("");

    if (error) {
      setHistoryError(`No se pudo eliminar esta sinastría: ${error.message}`);
      return;
    }
    if (!data) {
      setHistoryError("La sinastría ya no existe. Actualiza el historial.");
      return;
    }
    setHistory((current) => current.filter((entry) => entry.id !== id));
  }

  async function shareEntry(entry: Omit<SynastryEntry, "id" | "createdAt">, id: string) {
    setSharingId(id);
    setShareError("");
    setShareNotice("");

    try {
      const image = await createSynastryShareCard(me.name, entry.otherName, entry.result);
      const file = new File([image], "sinastria-astrared.png", { type: "image/png" });
      const shareText = `Te comparto nuestra sinastría de AstraRed: ${me.name} y ${entry.otherName}.`;

      if (Capacitor.isNativePlatform()) {
        const { value: canShare } = await Share.canShare();
        if (!canShare) throw new Error("Este dispositivo no permite compartir archivos.");
        const { uri } = await Filesystem.writeFile({
          path: `sinastria-astrared-${id || "actual"}.png`,
          data: await blobToBase64(image),
          directory: Directory.Cache,
          recursive: true,
        });
        await Share.share({
          title: "Sinastría de AstraRed",
          text: shareText,
          files: [uri],
          dialogTitle: "Compartir sinastría",
        });
        setShareNotice("Elige WhatsApp para enviar la tarjeta de sinastría.");
        return;
      }

      if (typeof navigator.share === "function" && navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: "Sinastría de AstraRed",
            text: shareText,
          });
          setShareNotice("Elige WhatsApp para enviar la tarjeta de sinastría.");
          return;
        } catch (cause) {
          if (cause instanceof DOMException && cause.name === "AbortError") {
            setShareNotice("Se canceló el envío de la tarjeta.");
            return;
          }
        }
      }

      const imageUrl = URL.createObjectURL(image);
      const download = document.createElement("a");
      download.href = imageUrl;
      download.download = file.name;
      download.click();
      window.setTimeout(() => URL.revokeObjectURL(imageUrl), 1000);

      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
      const whatsappWindow = window.open(whatsappUrl, "_blank");
      if (whatsappWindow) {
        whatsappWindow.opener = null;
        setShareNotice("La tarjeta se descargó. Adjunta el PNG en WhatsApp para enviarla.");
      } else {
        setShareNotice("La tarjeta se descargó. Abre WhatsApp y adjunta el PNG para enviarla.");
      }
    } catch (cause) {
      setShareError(
        cause instanceof Error
          ? cause.message
          : "No se pudo preparar la tarjeta para compartir.",
      );
    } finally {
      setSharingId("");
    }
  }

  const ownerCanSeeHistory = historyOwnerId === me.id;
  const previewEntry = preview
    ? { ...preview, id: "preview", createdAt: new Date().toISOString() }
    : null;

  return (
    <section className="space-y-6 rounded-3xl border border-fuchsia-300/20 bg-gradient-to-br from-slate-900 via-indigo-950/60 to-slate-950 p-5 shadow-xl sm:p-7">
      <div className="max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-fuchsia-200">
          Sinastría
        </p>
        <h2 className="mt-1 font-serif text-2xl text-white sm:text-3xl">
          Compara tu carta con otra persona
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          La otra persona no necesita una cuenta. Usamos sus datos para calcular
          la carta, pero no guardamos su fecha, hora ni localidad: el historial
          privado conserva el nombre y el resultado de la sinastría.
        </p>
      </div>

      <form onSubmit={(event) => void calculateSynastry(event)} className="grid gap-5 lg:grid-cols-2">
        <div className="space-y-4">
          <label className="block space-y-2 text-sm font-semibold text-slate-200">
            Nombre de la otra persona
            <input
              value={otherName}
              onChange={(event) => setOtherName(event.target.value)}
              maxLength={80}
              autoComplete="off"
              required
              className="min-h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-white focus:border-fuchsia-300 focus:outline-none"
              placeholder="Nombre para identificar esta historia"
            />
          </label>

          <label className="block space-y-2 text-sm font-semibold text-slate-200">
            Fecha de nacimiento
            <input
              type="date"
              value={birthDate}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(event) => setBirthDate(event.target.value)}
              required
              className="min-h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-white [color-scheme:dark] focus:border-fuchsia-300 focus:outline-none"
            />
          </label>

          <label className="block space-y-2 text-sm font-semibold text-slate-200">
            Hora de nacimiento{" "}
            <span className="font-normal text-slate-400">(opcional)</span>
            <input
              type="time"
              value={birthTime}
              onChange={(event) => setBirthTime(event.target.value)}
              className="min-h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-white [color-scheme:dark] focus:border-fuchsia-300 focus:outline-none"
            />
          </label>
          <p className="-mt-2 text-xs leading-5 text-slate-400">
            Si no la conoces, calcularemos con hora aproximada y no incluiremos
            los aspectos que dependen de la Luna y el Ascendente.
          </p>
        </div>

        <div className="space-y-4">
          <StepWhere onSelectCity={setCity} />
          <button
            type="submit"
            disabled={calculating || historyLoading || !ownerCanSeeHistory}
            className="min-h-12 w-full rounded-xl bg-fuchsia-300 px-5 py-3 text-sm font-extrabold text-slate-950 transition hover:bg-fuchsia-200 disabled:cursor-wait disabled:opacity-60"
          >
            {calculating ? "Calculando y guardando..." : "Calcular y guardar sinastría"}
          </button>
        </div>
      </form>

      {actionError && (
        <p role="alert" className="rounded-xl border border-rose-400/20 bg-rose-950/50 p-3 text-sm text-rose-200">
          {actionError}
        </p>
      )}
      {shareError && (
        <p role="alert" className="rounded-xl border border-rose-400/20 bg-rose-950/50 p-3 text-sm text-rose-200">
          {shareError}
        </p>
      )}
      {shareNotice && (
        <p role="status" className="rounded-xl border border-emerald-400/20 bg-emerald-950/40 p-3 text-sm text-emerald-100">
          {shareNotice}
        </p>
      )}

      {previewEntry && (
        <SynastryResultCard
          entry={previewEntry}
          ownerName={me.name}
          deleting={false}
          sharing={sharingId === "preview"}
          onDelete={() => undefined}
          onShare={() => void shareEntry(previewEntry, "preview")}
        />
      )}

      <div className="space-y-4 border-t border-slate-700/80 pt-5">
        <div>
          <h3 className="font-serif text-xl text-white">Historial de sinastrías</h3>
          <p className="mt-1 text-xs leading-5 text-slate-400">
            Solo tú puedes ver y borrar este historial. Las tarjetas se comparten
            como imágenes, sin publicar un enlace.
          </p>
        </div>
        {historyError && (
          <p role="alert" className="rounded-xl bg-rose-950/50 p-3 text-sm text-rose-200">
            {historyError}
          </p>
        )}
        {historyLoading || !ownerCanSeeHistory ? (
          <p className="text-sm text-slate-400">Cargando tu historial...</p>
        ) : history.length > 0 ? (
          <div className="grid gap-3 xl:grid-cols-2">
            {history.map((entry) => (
              <SynastryResultCard
                key={entry.id}
                entry={entry}
                ownerName={me.name}
                deleting={deletingId === entry.id}
                sharing={sharingId === entry.id}
                onDelete={() => void deleteEntry(entry.id)}
                onShare={() => void shareEntry(entry, entry.id)}
              />
            ))}
          </div>
        ) : (
          <p className="rounded-2xl border border-dashed border-slate-700 p-5 text-center text-sm text-slate-400">
            Tus sinastrías guardadas aparecerán aquí.
          </p>
        )}
      </div>
    </section>
  );
}

type SynastryResultCardProps = {
  entry: SynastryEntry;
  ownerName: string;
  deleting: boolean;
  sharing: boolean;
  onDelete: () => void;
  onShare: () => void;
};

function SynastryResultCard({
  entry,
  ownerName,
  deleting,
  sharing,
  onDelete,
  onShare,
}: SynastryResultCardProps) {
  return (
    <article className="space-y-3 rounded-2xl border border-fuchsia-300/15 bg-slate-950/65 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs text-slate-400">{formatHistoryDate(entry.createdAt)}</p>
          <h4 className="mt-1 font-serif text-lg text-white">
            {ownerName} ✦ {entry.otherName}
          </h4>
        </div>
        <p className="rounded-full border border-fuchsia-200/30 px-3 py-1 text-lg font-bold text-fuchsia-100">
          {entry.result.percent}%
        </p>
      </div>
      {entry.result.timeApproximate && (
        <p className="text-xs text-amber-200">
          Hora desconocida o aproximada: Luna y Ascendente no se usaron en todos los aspectos.
        </p>
      )}
      <ul className="space-y-1 text-sm text-slate-300">
        {entry.result.aspects.slice(0, 3).map((aspect, index) => (
          <li key={`${aspect.a}-${aspect.b}-${aspect.type}-${index}`}>
            {PLANET_META[aspect.a].name} · {PLANET_META[aspect.b].name}:{" "}
            {ASPECT_META[aspect.type].name}
          </li>
        ))}
        {entry.result.aspects.length === 0 && (
          <li>Una conexión para explorar más allá de los aspectos principales.</li>
        )}
      </ul>
      <div className="flex flex-wrap gap-2 border-t border-slate-800 pt-3">
        <button
          type="button"
          onClick={onShare}
          disabled={sharing || deleting}
          className="rounded-lg bg-fuchsia-300 px-3 py-2 text-xs font-bold text-slate-950 hover:bg-fuchsia-200 disabled:opacity-50"
        >
          {sharing ? "Preparando tarjeta..." : "Compartir por WhatsApp"}
        </button>
        {entry.id !== "preview" && (
          <button
            type="button"
            onClick={onDelete}
            disabled={deleting || sharing}
            className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 hover:border-rose-300/50 hover:text-rose-200 disabled:opacity-50"
          >
            {deleting ? "Eliminando..." : "Eliminar"}
          </button>
        )}
      </div>
    </article>
  );
}
