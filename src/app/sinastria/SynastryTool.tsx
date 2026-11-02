"use client";

import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { Directory, Filesystem } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { StepWhere, type CityResult } from "@/components/StepWhere";
import { SynastryWheel } from "@/components/SynastryWheel";
import { computeNatalChart } from "@/lib/astro/chart";
import { computeSynastry } from "@/lib/astro/synastry";
import { buildSynastryInterpretation } from "@/lib/astro/synastry-interpretation";
import { createSynastryPdf } from "@/lib/astro/synastry-pdf";
import { createSynastryShareCard } from "@/lib/astro/synastry-share-card";
import {
  buildSynastrySummary,
  buildSynastrySummaryText,
} from "@/lib/astro/synastry-summary";
import { ASPECT_META, PLANET_META, SIGNS } from "@/lib/astro/constants";
import { supabase } from "@/lib/supabase/client";
import type {
  AspectName,
  NatalChart,
  Placement,
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

const ASPECT_ORDER: AspectName[] = [
  "conjunction",
  "opposition",
  "trine",
  "sextile",
  "square",
];
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

function isPlacement(value: unknown): value is Placement {
  if (!isRecord(value)) return false;

  const longitude = value.longitude;
  const signIndex = value.signIndex;
  const degreeInSign = value.degreeInSign;
  const house = value.house;

  if (
    typeof value.id !== "string" ||
    !PLANET_IDS.has(value.id as PlanetId) ||
    typeof longitude !== "number" ||
    !Number.isFinite(longitude) ||
    longitude < 0 ||
    longitude >= 360 ||
    typeof signIndex !== "number" ||
    !Number.isInteger(signIndex) ||
    signIndex < 0 ||
    signIndex > 11 ||
    typeof value.sign !== "string" ||
    typeof degreeInSign !== "number" ||
    !Number.isFinite(degreeInSign) ||
    typeof house !== "number" ||
    !Number.isInteger(house) ||
    house < 1 ||
    house > 12
  ) {
    return false;
  }

  const expectedSignIndex = Math.floor(longitude / 30);
  const expectedDegree = longitude - expectedSignIndex * 30;

  return (
    signIndex === expectedSignIndex &&
    value.sign === SIGNS[expectedSignIndex] &&
    Math.abs(degreeInSign - expectedDegree) < 0.00001
  );
}

function isNatalChart(value: unknown): value is NatalChart {
  if (!isRecord(value)) return false;

  const validHouseSystem =
    value.houseSystem === undefined ||
    value.houseSystem === "placidus" ||
    value.houseSystem === "equal" ||
    value.houseSystem === "equal-high-latitude";

  if (
    typeof value.generatedAt !== "string" ||
    !Number.isFinite(Date.parse(value.generatedAt)) ||
    typeof value.timeUnknown !== "boolean" ||
    !validHouseSystem ||
    !Array.isArray(value.houses) ||
    value.houses.length !== 12 ||
    !value.houses.every(
      (house) =>
        typeof house === "number" &&
        Number.isFinite(house) &&
        house >= 0 &&
        house < 360,
    ) ||
    !Array.isArray(value.planets) ||
    value.planets.length === 0 ||
    !value.planets.every(isPlacement) ||
    !isRecord(value.triad) ||
    !isPlacement(value.triad.sun) ||
    value.triad.sun.id !== "sun" ||
    !isPlacement(value.triad.moon) ||
    value.triad.moon.id !== "moon" ||
    !isPlacement(value.triad.asc) ||
    value.triad.asc.id !== "asc"
  ) {
    return false;
  }

  return true;
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
    (value.charts === undefined ||
      (isRecord(value.charts) &&
        isNatalChart(value.charts.a) &&
        isNatalChart(value.charts.b))) &&
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
  const [selectedReport, setSelectedReport] = useState<SynastryEntry | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [sharingId, setSharingId] = useState("");
  const [sharingSummaryId, setSharingSummaryId] = useState("");
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
    setSelectedReport(null);

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
      const synastry = computeSynastry(me.chart, otherChart);
      const result: SynastryResult = {
        ...synastry,
        charts: {
          a: me.chart,
          b: otherChart,
        },
      };
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
      setSelectedReport(entry);
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
    setSelectedReport((current) => current?.id === id ? null : current);
  }

  async function shareEntry(entry: Omit<SynastryEntry, "id" | "createdAt">, id: string) {
    setSharingId(id);
    setShareError("");
    setShareNotice("");

    try {
      const pdf = await createSynastryPdf(
        me.name,
        entry.otherName,
        entry.result,
        id === "preview" ? new Date().toISOString() : (
          history.find((item) => item.id === id)?.createdAt ??
          new Date().toISOString()
        ),
      );

      const file = new File(
        [pdf],
        "sinastria-astrared.pdf",
        { type: "application/pdf" },
      );

      const shareText =
        `Te comparto el informe completo de nuestra sinastría de AstraRed: ${me.name} y ${entry.otherName}.`;

      if (Capacitor.isNativePlatform()) {
        const { value: canShare } = await Share.canShare();

        if (!canShare) {
          throw new Error("Este dispositivo no permite compartir archivos.");
        }

        const { uri } = await Filesystem.writeFile({
          path: `sinastria-astrared-${id || "actual"}.pdf`,
          data: await blobToBase64(pdf),
          directory: Directory.Cache,
          recursive: true,
        });

        await Share.share({
          title: "Informe de sinastría de AstraRed",
          text: shareText,
          files: [uri],
          dialogTitle: "Compartir informe PDF",
        });

        setShareNotice(
          "El PDF está preparado. Selecciona WhatsApp u otra aplicación para compartirlo.",
        );
        return;
      }

      if (
        typeof navigator.share === "function" &&
        navigator.canShare?.({ files: [file] })
      ) {
        try {
          await navigator.share({
            files: [file],
            title: "Informe de sinastría de AstraRed",
            text: shareText,
          });

          setShareNotice("El menú de compartir recibió el PDF.");
          return;
        } catch (cause) {
          if (cause instanceof DOMException && cause.name === "AbortError") {
            setShareNotice("Se canceló el envío del PDF.");
            return;
          }

          throw cause;
        }
      }

      const pdfUrl = URL.createObjectURL(pdf);
      const download = document.createElement("a");
      download.href = pdfUrl;
      download.download = file.name;
      download.click();

      window.setTimeout(() => URL.revokeObjectURL(pdfUrl), 1500);

      const whatsappUrl =
        `https://wa.me/?text=${encodeURIComponent(shareText)}`;

      const whatsappWindow = window.open(whatsappUrl, "_blank");

      if (whatsappWindow) {
        whatsappWindow.opener = null;
        setShareNotice(
          "El PDF se descargó. Adjunta sinastria-astrared.pdf en WhatsApp.",
        );
      } else {
        setShareNotice(
          "El PDF se descargó. Abre WhatsApp y adjunta sinastria-astrared.pdf.",
        );
      }
    } catch (cause) {
      setShareError(
        cause instanceof Error
          ? cause.message
          : "No se pudo preparar el informe PDF.",
      );
    } finally {
      setSharingId("");
    }
  }

  async function shareSummaryWhatsApp(
    entry: Omit<SynastryEntry, "id" | "createdAt">,
    id: string,
  ) {
    setSharingSummaryId(id);
    setShareError("");
    setShareNotice("");

    try {
      const image = await createSynastryShareCard(
        me.name,
        entry.otherName,
        entry.result,
      );
      const text = buildSynastrySummaryText(
        me.name,
        entry.otherName,
        entry.result,
      );
      const file = new File([image], "resumen-sinastria-astrared.png", {
        type: "image/png",
      });

      if (Capacitor.isNativePlatform()) {
        const { value: canShare } = await Share.canShare();
        if (!canShare) {
          throw new Error("Este dispositivo no permite compartir archivos.");
        }

        const { uri } = await Filesystem.writeFile({
          path: `resumen-sinastria-${id}.png`,
          data: await blobToBase64(image),
          directory: Directory.Cache,
          recursive: true,
        });
        await Share.share({
          title: "Resumen de sinastría de AstraRed",
          text,
          files: [uri],
          dialogTitle: "Compartir resumen por WhatsApp",
        });
        setShareNotice("Selecciona WhatsApp para compartir la imagen y el resumen.");
        return;
      }

      if (
        typeof navigator.share === "function" &&
        navigator.canShare?.({ files: [file] })
      ) {
        try {
          await navigator.share({
            files: [file],
            title: "Resumen de sinastría de AstraRed",
            text,
          });
          setShareNotice("El menú para compartir recibió la imagen y el resumen.");
          return;
        } catch (cause) {
          if (cause instanceof DOMException && cause.name === "AbortError") {
            setShareNotice("Se canceló el envío del resumen.");
            return;
          }
          throw cause;
        }
      }

      const imageUrl = URL.createObjectURL(image);
      const download = document.createElement("a");
      download.href = imageUrl;
      download.download = file.name;
      download.click();
      window.setTimeout(() => URL.revokeObjectURL(imageUrl), 1500);

      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
      const whatsappWindow = window.open(whatsappUrl, "_blank");
      if (whatsappWindow) {
        whatsappWindow.opener = null;
        setShareNotice(
          "La imagen se descargó y WhatsApp se abrió. Adjunta resumen-sinastria-astrared.png.",
        );
      } else {
        setShareNotice(
          "La imagen se descargó. Abre WhatsApp y adjunta resumen-sinastria-astrared.png.",
        );
      }
    } catch (cause) {
      setShareError(
        cause instanceof Error
          ? cause.message
          : "No se pudo preparar el resumen para WhatsApp.",
      );
    } finally {
      setSharingSummaryId("");
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
          sharingSummary={sharingSummaryId === "preview"}
          onDelete={() => undefined}
          onShare={() => void shareEntry(previewEntry, "preview")}
          onShareSummary={() =>
            void shareSummaryWhatsApp(previewEntry, "preview")
          }
          onView={() => setSelectedReport(previewEntry)}
        />
      )}

      {selectedReport && (
        <SynastryFullReport
          entry={selectedReport}
          ownerName={me.name}
          onClose={() => setSelectedReport(null)}
          onShare={() => void shareEntry(selectedReport, selectedReport.id)}
          onShareSummary={() =>
            void shareSummaryWhatsApp(selectedReport, selectedReport.id)
          }
          sharing={sharingId === selectedReport.id}
          sharingSummary={sharingSummaryId === selectedReport.id}
        />
      )}

      <div className="space-y-4 border-t border-slate-700/80 pt-5">
        <div>
          <h3 className="font-serif text-xl text-white">Historial de sinastrías</h3>
          <p className="mt-1 text-xs leading-5 text-slate-400">
            Solo tú puedes ver y borrar este historial. Exporta el informe PDF
            o comparte un resumen visual por WhatsApp.
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
                sharingSummary={sharingSummaryId === entry.id}
                onDelete={() => void deleteEntry(entry.id)}
                onShare={() => void shareEntry(entry, entry.id)}
                onShareSummary={() => void shareSummaryWhatsApp(entry, entry.id)}
                onView={() => setSelectedReport(entry)}
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
  sharingSummary: boolean;
  onDelete: () => void;
  onShare: () => void;
  onShareSummary: () => void;
  onView: () => void;
};

function SynastryResultCard({
  entry,
  ownerName,
  deleting,
  sharing,
  sharingSummary,
  onDelete,
  onShare,
  onShareSummary,
  onView,
}: SynastryResultCardProps) {
  const summary = buildSynastrySummary(entry.result);

  return (
    <article className="space-y-3 rounded-2xl border border-fuchsia-300/15 bg-slate-950/65 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs text-slate-400">{formatHistoryDate(entry.createdAt)}</p>
          <h4 className="mt-1 font-serif text-lg text-white">
            {ownerName} · {entry.otherName}
          </h4>
        </div>
        <div className="text-right">
          <p className="rounded-full border border-fuchsia-200/30 px-3 py-1 text-lg font-bold text-fuchsia-100">
            {summary.score}/100
          </p>
          <p className="mt-1 max-w-40 text-xs leading-4 text-slate-400">
            Compatibilidad astrológica
          </p>
        </div>
      </div>
      <ul className="space-y-1.5 text-sm text-slate-300">
        {summary.highlights.map((aspect, index) => (
          <li key={`${aspect.a}-${aspect.b}-${aspect.type}-${index}`}>
            <span className="font-medium text-white">
              {PLANET_META[aspect.a].name} · {ASPECT_META[aspect.type].name} ·{" "}
              {PLANET_META[aspect.b].name}
            </span>
            <span className="ml-2 text-xs text-slate-400">
              Orbe {aspect.orb.toFixed(2)}°
            </span>
          </li>
        ))}
        {summary.highlights.length === 0 && (
          <li>No hay contactos disponibles para destacar.</li>
        )}
      </ul>
      <p className="text-xs text-slate-400">
        {summary.total} contactos · {summary.harmonious} armónicos ·{" "}
        {summary.challenging} de ajuste · {summary.conjunctions} conjunciones
      </p>
      {summary.timeApproximate && (
        <p className="text-xs leading-5 text-amber-200">
          Hora aproximada: los contactos de Luna y Ascendente se omiten.
        </p>
      )}
      <div className="flex flex-wrap gap-2 border-t border-slate-800 pt-3">
        <button
          type="button"
          onClick={onView}
          disabled={deleting}
          className="min-h-11 rounded-lg border border-fuchsia-300/40 px-3 py-2 text-xs font-bold text-fuchsia-100 hover:bg-fuchsia-300/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fuchsia-200 disabled:opacity-50"
        >
          Ver detalles
        </button>
        <button
          type="button"
          onClick={onShare}
          disabled={sharing || deleting}
          className="min-h-11 rounded-lg bg-fuchsia-300 px-3 py-2 text-xs font-bold text-slate-950 hover:bg-fuchsia-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fuchsia-200 disabled:opacity-50"
        >
          {sharing ? "Preparando PDF..." : "Compartir PDF"}
        </button>
        <button
          type="button"
          onClick={onShareSummary}
          disabled={sharingSummary || deleting || sharing}
          className="min-h-11 rounded-lg border border-emerald-300/40 px-3 py-2 text-xs font-bold text-emerald-100 hover:bg-emerald-300/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-200 disabled:opacity-50"
        >
          {sharingSummary ? "Preparando imagen..." : "Resumen por WhatsApp"}
        </button>
        {entry.id !== "preview" && (
          <button
            type="button"
            onClick={onDelete}
            disabled={deleting || sharing || sharingSummary}
            className="min-h-11 rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 hover:border-rose-300/50 hover:text-rose-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fuchsia-200 disabled:opacity-50"
          >
            {deleting ? "Eliminando..." : "Eliminar"}
          </button>
        )}
      </div>
    </article>
  );
}

type SynastryFullReportProps = {
  entry: SynastryEntry;
  ownerName: string;
  onClose: () => void;
  onShare: () => void;
  onShareSummary: () => void;
  sharing: boolean;
  sharingSummary: boolean;
};

function SynastryFullReport({
  entry,
  ownerName,
  onClose,
  onShare,
  onShareSummary,
  sharing,
  sharingSummary,
}: SynastryFullReportProps) {
  const summary = buildSynastrySummary(entry.result);
  const charts = entry.result.charts;
  const interpretation = buildSynastryInterpretation(entry.result);

  return (
    <section className="space-y-5 rounded-3xl border border-fuchsia-300/25 bg-slate-950/90 p-5 shadow-xl sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-fuchsia-200">
            Resumen de sinastría
          </p>
          <h3 className="mt-2 font-serif text-2xl text-white">
            {ownerName} y {entry.otherName}
          </h3>
          <p className="mt-1 text-xs text-slate-400">
            Calculado: {formatHistoryDate(entry.createdAt)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onShare}
            disabled={sharing || sharingSummary}
            className="min-h-11 rounded-xl bg-fuchsia-300 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-fuchsia-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fuchsia-200 disabled:opacity-50"
          >
            {sharing ? "Preparando PDF..." : "Compartir PDF"}
          </button>
          <button
            type="button"
            onClick={onShareSummary}
            disabled={sharingSummary || sharing}
            className="min-h-11 rounded-xl border border-emerald-300/40 px-4 py-2 text-xs font-bold text-emerald-100 hover:bg-emerald-300/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-200 disabled:opacity-50"
          >
            {sharingSummary ? "Preparando imagen..." : "Resumen por WhatsApp"}
          </button>
        </div>
      </div>

      <div className="space-y-4 rounded-3xl border border-amber-300/30 bg-[radial-gradient(ellipse_at_top,rgba(120,53,15,0.2),transparent_58%),linear-gradient(160deg,#111827,#080817_70%)] p-5 text-center sm:p-7">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-200">
          Compatibilidad astrológica
        </p>
        <p className="font-serif text-5xl font-bold text-amber-100">
          {summary.score}<span className="text-2xl text-amber-300">/100</span>
        </p>
        <p className="mx-auto max-w-xl text-xs leading-5 text-slate-300">
          Resultado basado en los aspectos planetarios entre ambas cartas.
        </p>

        <div className="mx-auto max-w-2xl space-y-3 border-t border-amber-100/15 pt-4 text-left">
          <h4 className="text-xs font-bold uppercase tracking-[0.18em] text-amber-200">
            Contactos destacados
          </h4>
          {summary.highlights.length > 0 ? (
            <ul className="grid gap-2 sm:grid-cols-3">
              {summary.highlights.map((aspect, index) => (
                <li
                  key={`${aspect.a}-${aspect.b}-${aspect.type}-${index}`}
                  className="rounded-xl border border-white/10 bg-slate-950/60 p-3"
                >
                  <p className="text-sm font-semibold text-white">
                    {PLANET_META[aspect.a].name} · {ASPECT_META[aspect.type].name}
                  </p>
                  <p className="text-sm text-white">
                    {PLANET_META[aspect.b].name}
                  </p>
                  <p className="mt-1 text-xs text-slate-300">
                    Orbe {aspect.orb.toFixed(2)}°
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-300">
              No hay contactos disponibles para destacar.
            </p>
          )}
          <p className="text-xs leading-5 text-slate-300">
            {summary.total} contactos · {summary.harmonious} armónicos ·{" "}
            {summary.challenging} de ajuste · {summary.conjunctions} conjunciones
          </p>
        </div>

        {summary.timeApproximate && (
          <p className="rounded-xl border border-amber-200/20 bg-amber-950/30 p-3 text-xs leading-5 text-amber-100">
            Hora de nacimiento desconocida o aproximada: los contactos de Luna
            y Ascendente se omiten del análisis.
          </p>
        )}
      </div>

      {entry.id === "preview" && (
        <p className="rounded-xl border border-amber-300/30 bg-amber-950/30 p-3 text-sm text-amber-100">
          Vista previa: este resultado todavía no está guardado en el historial.
        </p>
      )}

      <details className="group rounded-2xl border border-slate-700 bg-slate-900/50 p-4">
        <summary className="min-h-11 cursor-pointer py-2 font-semibold text-amber-100 marker:text-amber-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fuchsia-200">
          Lectura simbólica por área
        </summary>
      <section className="space-y-4 rounded-2xl border border-amber-300/20 bg-slate-900/70 p-4 sm:p-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-300">
            AstraRed · Estudio de sinastría
          </p>
          <h4 className="mt-2 font-serif text-2xl text-white">
            Lectura interpretativa
          </h4>
          <p className="mt-2 text-xs leading-5 text-slate-400">
            Interpretación astrológica basada en los aspectos registrados y sus
            dinámicas.
          </p>
        </div>

        {interpretation.notes.map((note, index) => (
          <p
            key={`interpretation-note-${index}`}
            className="rounded-xl border border-amber-300/20 bg-amber-950/20 p-3 text-xs leading-5 text-amber-100"
          >
            {note}
          </p>
        ))}

        {interpretation.sections.length === 0 ? (
          <p className="rounded-xl border border-slate-700 p-4 text-sm leading-6 text-slate-300">
            No hay aspectos disponibles para una lectura temática.
          </p>
        ) : (
          <div className="space-y-3">
            {interpretation.sections.map((section) => (
              <section
                key={section.id}
                className="rounded-xl border border-slate-700/80 bg-slate-950/60 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h5 className="font-semibold text-amber-100">
                    {section.title}
                  </h5>
                  <span className="text-xs text-slate-500">
                    {section.evidence.length} {section.evidence.length === 1 ? "contacto" : "contactos"}
                  </span>
                </div>

                <p className="mt-2 text-sm leading-6 text-slate-300">
                  {section.summary}
                </p>

                <div className="mt-3 space-y-3">
                  {section.evidence.map((item) => (
                    <article
                      key={`${section.id}-${item.aspectIndex}`}
                      className="border-l-2 border-amber-300/50 pl-3"
                    >
                      <p className="text-sm font-semibold text-white">
                        {item.planetAName} de A
                        <span className="px-2 text-amber-300">·</span>
                        {item.aspectName}
                        <span className="px-2 text-amber-300">·</span>
                        {item.planetBName} de B
                      </p>
                      <p className="mt-1 text-xs leading-5 text-slate-300">
                        {item.interpretation}
                      </p>
                      <p className="mt-1 text-[11px] text-slate-500">
                        Separación {item.exactAngle.toFixed(2)}° · Orbe{" "}
                        {item.orb.toFixed(2)}° ({item.orbDescription})
                      </p>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        <div className="rounded-xl border border-amber-300/20 bg-slate-950/70 p-4">
          <h5 className="font-semibold text-amber-100">
            Nota de lectura
          </h5>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            {interpretation.conclusion}
          </p>
        </div>
      </section>
      </details>

      <details className="group rounded-2xl border border-slate-700 bg-slate-900/50 p-4">
        <summary className="min-h-11 cursor-pointer py-2 font-semibold text-white marker:text-fuchsia-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fuchsia-200">
          Rueda doble de sinastría
        </summary>
        <div className="pt-4">
          {charts ? (
            <SynastryWheel
              chartA={charts.a}
              chartB={charts.b}
              aspects={summary.aspects}
              nameA={ownerName}
              nameB={entry.otherName}
            />
          ) : (
            <p className="rounded-xl border border-slate-700 bg-slate-900/50 p-4 text-sm leading-6 text-slate-300">
              Este registro histórico no conserva las cartas originales; no es
              posible reconstruir una rueda doble fiable.
            </p>
          )}
        </div>
      </details>

      <details className="group rounded-2xl border border-slate-700 bg-slate-900/50 p-4">
        <summary className="min-h-11 cursor-pointer py-2 font-semibold text-white marker:text-fuchsia-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fuchsia-200">
          Ver todos los aspectos ({summary.total})
        </summary>
      <div className="space-y-4 pt-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="font-serif text-xl text-white">Aspectos registrados</h4>
        <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">
          {summary.total} contactos registrados
        </span>
      </div>

      {summary.aspects.length === 0 ? (
        <p className="rounded-xl border border-slate-800 p-4 text-sm text-slate-400">
          No hay contactos disponibles para mostrar.
        </p>
      ) : (
        <div className="space-y-4">
          {ASPECT_ORDER.map((type) => {
            const grouped = summary.aspects.filter((aspect) => aspect.type === type);

            if (grouped.length === 0) return null;

            return (
              <section
                key={type}
                className="overflow-hidden rounded-2xl border border-slate-800"
              >
                <div className="flex items-center justify-between gap-3 bg-slate-900 px-4 py-3">
                  <h5 className="font-semibold text-fuchsia-100">
                    {ASPECT_META[type].name}
                  </h5>
                  <span className="text-xs text-slate-400">
                    {grouped.length} {grouped.length === 1 ? "aspecto" : "aspectos"}
                  </span>
                </div>

                <div className="divide-y divide-slate-800">
                  {grouped.map((aspect, index) => (
                    <div
                      key={`${aspect.a}-${aspect.b}-${type}-${index}`}
                      className="space-y-2 p-4"
                    >
                      <p className="font-medium text-white">
                        {PLANET_META[aspect.a].name}
                        <span className="px-2 text-fuchsia-300">con</span>
                        {PLANET_META[aspect.b].name}
                      </p>
                      <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-400">
                        <span>Orbe: {aspect.orb.toFixed(2)}°</span>
                        <span>Separación angular: {aspect.exactAngle.toFixed(2)}°</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      <p className="text-xs leading-5 text-slate-500">
        Se muestran los aspectos conservados en el resultado. En registros
        antiguos no se reconstruyen datos ausentes.
      </p>
      </div>
      </details>

      <div className="border-t border-slate-800 pt-4">
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 hover:border-fuchsia-300/50 hover:text-white"
        >
          Cerrar informe
        </button>
      </div>
    </section>
  );
}
