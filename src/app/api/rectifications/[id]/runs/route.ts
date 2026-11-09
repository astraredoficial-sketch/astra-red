import {
  DEFAULT_RECTIFICATION_EVALUATION_CONFIG,
  evaluateRectificationCandidates,
  type RectificationEvaluationInput,
  type RectificationEvaluationResult,
} from "@/lib/astro/rectification/evaluation";
import { generateBirthTimeCandidates } from "@/lib/astro/rectification/candidates";
import {
  authenticateRectificationRequest,
  databaseErrorResponse,
  isUuid,
  readJsonBody,
  rectificationJsonResponse,
} from "@/lib/astro/rectification/server";
import { validateRectificationEventInput } from "@/lib/astro/rectification/validation";

type RouteParams = { params: Promise<{ id: string }> };
type TechniqueWeights = RectificationEvaluationResult["astronomicalConfiguration"]["normalizedTechniqueWeights"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function parseTechniqueWeights(value: unknown): TechniqueWeights {
  if (!isRecord(value)) {
    throw new RangeError("Las opciones de evaluación no son válidas.");
  }
  if (Object.keys(value).some((key) => key !== "techniqueWeights")) {
    throw new RangeError("La solicitud contiene opciones no permitidas.");
  }

  const supplied = value.techniqueWeights;
  if (supplied !== undefined && !isRecord(supplied)) {
    throw new RangeError("Las ponderaciones de las técnicas no son válidas.");
  }
  const rawWeights = supplied ?? DEFAULT_RECTIFICATION_EVALUATION_CONFIG.techniqueWeights;
  if (
    isRecord(rawWeights) &&
    Object.keys(rawWeights).some(
      (weight) =>
        weight !== "transits" &&
        weight !== "secondaryProgressions" &&
        weight !== "solarArc",
    )
  ) {
    throw new RangeError("La solicitud contiene ponderaciones no permitidas.");
  }
  const parseWeight = (weight: unknown): number => {
    if (
      typeof weight !== "number" ||
      !Number.isFinite(weight) ||
      weight < 0 ||
      weight > 100
    ) {
      throw new RangeError("Cada ponderación debe ser un número entre 0 y 100.");
    }
    return weight;
  };
  const weights: TechniqueWeights = {
    transits: parseWeight(
      isRecord(rawWeights) ? rawWeights.transits ?? 1 : 1,
    ),
    secondaryProgressions: parseWeight(
      isRecord(rawWeights) ? rawWeights.secondaryProgressions ?? 1 : 1,
    ),
    solarArc: parseWeight(
      isRecord(rawWeights) ? rawWeights.solarArc ?? 1 : 1,
    ),
  };
  if (Object.values(weights).every((weight) => weight === 0)) {
    throw new RangeError(
      "Asigna a cada técnica un peso entre 0 y 100 y deja al menos uno mayor que cero.",
    );
  }
  return weights;
}

function toEvaluationEvents(
  rows: unknown,
): RectificationEvaluationInput["events"] {
  if (!Array.isArray(rows)) {
    throw new RangeError("No se pudieron leer los acontecimientos.");
  }

  return rows.map((value) => {
    if (!isRecord(value) || typeof value.id !== "string") {
      throw new RangeError("Un acontecimiento almacenado no es válido.");
    }
    const event = validateRectificationEventInput({
      category: value.category,
      dateStart: value.date_start,
      dateEnd: value.date_end,
      datePrecision: value.date_precision,
      eventTimeZone: value.event_timezone,
      relevance: value.relevance,
    });
    if (
      !event.category ||
      !event.dateStart ||
      !event.dateEnd ||
      !event.datePrecision ||
      event.relevance === undefined
    ) {
      throw new RangeError("Un acontecimiento almacenado está incompleto.");
    }
    return {
      id: value.id,
      category: event.category,
      dateStart: event.dateStart,
      dateEnd: event.dateEnd,
      datePrecision: event.datePrecision,
      eventTimeZone: event.eventTimeZone ?? null,
      relevance: event.relevance,
    };
  });
}

function compactResult(
  result: RectificationEvaluationResult,
): RectificationEvaluationResult {
  return {
    ...result,
    candidates: result.candidates.map((candidate, index) => ({
      ...candidate,
      eventEvidence: candidate.eventEvidence.map((evidence) => ({
        ...evidence,
        peakContacts:
          index < 5
            ? evidence.peakContacts
            : [],
      })),
    })),
  };
}

export async function GET(request: Request, context: RouteParams) {
  const authenticated = await authenticateRectificationRequest(
    request.headers.get("authorization"),
  );
  if (!authenticated) {
    return rectificationJsonResponse({ error: "Inicia sesión para continuar." }, { status: 401 });
  }

  const { id } = await context.params;
  if (!isUuid(id)) {
    return rectificationJsonResponse({ error: "La rectificación no es válida." }, { status: 400 });
  }

  const { data: rectification, error: rectificationError } =
    await authenticated.client
      .from("natal_rectifications")
      .select("id")
      .eq("id", id)
      .maybeSingle();
  if (rectificationError) {
    return databaseErrorResponse("validar rectificación de resultados", rectificationError);
  }
  if (!rectification) {
    return rectificationJsonResponse({ error: "La rectificación no existe." }, { status: 404 });
  }

  const [latestResult, history] = await Promise.all([
    authenticated.client
      .from("natal_rectification_runs")
      .select("id, methodology_version, status, candidate_count, event_count, score_gap, input_snapshot, results, created_at")
      .eq("rectification_id", id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    authenticated.client
      .from("natal_rectification_runs")
      .select("id, methodology_version, status, candidate_count, event_count, score_gap, created_at")
      .eq("rectification_id", id)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);
  if (latestResult.error) {
    return databaseErrorResponse("consultar último resultado de rectificación", latestResult.error);
  }
  if (history.error) {
    return databaseErrorResponse("consultar historial de rectificación", history.error);
  }

  return rectificationJsonResponse({
    latestRun: latestResult.data,
    history: history.data,
  });
}

export async function POST(request: Request, context: RouteParams) {
  const authenticated = await authenticateRectificationRequest(
    request.headers.get("authorization"),
  );
  if (!authenticated) {
    return rectificationJsonResponse({ error: "Inicia sesión para continuar." }, { status: 401 });
  }

  const { id } = await context.params;
  if (!isUuid(id)) {
    return rectificationJsonResponse({ error: "La rectificación no es válida." }, { status: 400 });
  }

  const parsed = await readJsonBody(request);
  if ("response" in parsed) return parsed.response;

  let techniqueWeights: TechniqueWeights;
  try {
    techniqueWeights = parseTechniqueWeights(parsed.value);
  } catch (error) {
    if (error instanceof RangeError) {
      return rectificationJsonResponse({ error: error.message }, { status: 400 });
    }
    throw error;
  }

  const { data: rectification, error: rectificationError } =
    await authenticated.client
      .from("natal_rectifications")
      .select("id, birth_date, birth_latitude, birth_longitude, birth_timezone, interval_start_date, interval_start_time, interval_end_date, interval_end_time, candidate_step_minutes")
      .eq("id", id)
      .maybeSingle();
  if (rectificationError) {
    return databaseErrorResponse("consultar datos para rectificación", rectificationError);
  }
  if (!rectification) {
    return rectificationJsonResponse({ error: "La rectificación no existe." }, { status: 404 });
  }

  const { data: eventRows, error: eventError } = await authenticated.client
    .from("rectification_events")
    .select("id, category, date_start, date_end, date_precision, event_timezone, relevance")
    .eq("rectification_id", id)
    .order("date_start", { ascending: true });
  if (eventError) return databaseErrorResponse("consultar acontecimientos para rectificación", eventError);

  let evaluated: RectificationEvaluationResult;
  try {
    const timeZone = rectification.birth_timezone;
    const candidates = generateBirthTimeCandidates(
      {
        date: rectification.interval_start_date,
        time: String(rectification.interval_start_time).slice(0, 5),
      },
      {
        date: rectification.interval_end_date,
        time: String(rectification.interval_end_time).slice(0, 5),
      },
      timeZone,
      rectification.candidate_step_minutes,
    );
    const events = toEvaluationEvents(eventRows);
    if (events.length === 0 || events.length > 50) {
      throw new RangeError("Agrega entre 1 y 50 acontecimientos antes de evaluar.");
    }
    evaluated = evaluateRectificationCandidates(
      {
        birthDate: rectification.birth_date,
        birthLocation: {
          latitude: rectification.birth_latitude,
          longitude: rectification.birth_longitude,
          timeZone,
        },
        candidates: candidates.candidates,
        events,
      },
      {
        ...DEFAULT_RECTIFICATION_EVALUATION_CONFIG,
        techniqueWeights,
      },
    );
  } catch (error) {
    if (error instanceof RangeError) {
      return rectificationJsonResponse({ error: error.message }, { status: 400 });
    }
    console.error("No se pudo calcular la rectificación natal:", error);
    return rectificationJsonResponse(
      { error: "No se pudo calcular la rectificación. Inténtalo de nuevo." },
      { status: 500 },
    );
  }

  const storedResult = compactResult(evaluated);
  const inputSnapshot = {
    birthDate: rectification.birth_date,
    birthLocation: {
      latitude: rectification.birth_latitude,
      longitude: rectification.birth_longitude,
      timeZone: rectification.birth_timezone,
    },
    candidateInterval: {
      startDate: rectification.interval_start_date,
      startTime: String(rectification.interval_start_time).slice(0, 5),
      endDate: rectification.interval_end_date,
      endTime: String(rectification.interval_end_time).slice(0, 5),
      stepMinutes: rectification.candidate_step_minutes,
      count: evaluated.candidates.length,
    },
    events: toEvaluationEvents(eventRows),
  };
  const { data: run, error: insertError } = await authenticated.client
    .from("natal_rectification_runs")
    .insert({
      rectification_id: id,
      user_id: authenticated.userId,
      methodology_version: evaluated.methodologyVersion,
      status: evaluated.status,
      candidate_count: evaluated.candidates.length,
      event_count: evaluated.candidates[0]?.eventEvidence.length ?? 0,
      score_gap: evaluated.scoreGap,
      input_snapshot: inputSnapshot,
      results: storedResult,
    })
    .select("id, methodology_version, status, candidate_count, event_count, score_gap, input_snapshot, results, created_at")
    .single();
  if (insertError) {
    return databaseErrorResponse("guardar resultado de rectificación", insertError);
  }

  return rectificationJsonResponse({ run }, { status: 201 });
}
