import {
  authenticateRectificationRequest,
  databaseErrorResponse,
  isUuid,
  readJsonBody,
  rectificationJsonResponse,
} from "@/lib/astro/rectification/server";
import { validateRectificationEventInput } from "@/lib/astro/rectification/validation";

type RouteParams = { params: Promise<{ id: string }> };

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
    return databaseErrorResponse(
      "validar rectificación de acontecimientos",
      rectificationError,
    );
  }
  if (!rectification) {
    return rectificationJsonResponse({ error: "La rectificación no existe." }, { status: 404 });
  }

  const { data, error } = await authenticated.client
    .from("rectification_events")
    .select("*")
    .eq("rectification_id", id)
    .order("date_start", { ascending: true });
  if (error) return databaseErrorResponse("listar acontecimientos", error);

  return rectificationJsonResponse({ events: data });
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

  let event;
  try {
    event = validateRectificationEventInput(parsed.value);
  } catch (error) {
    if (error instanceof RangeError) {
      return rectificationJsonResponse({ error: error.message }, { status: 400 });
    }
    throw error;
  }

  const { data: rectification, error: rectificationError } =
    await authenticated.client
      .from("natal_rectifications")
      .select("id")
      .eq("id", id)
      .maybeSingle();
  if (rectificationError) {
    return databaseErrorResponse(
      "validar rectificación de acontecimiento",
      rectificationError,
    );
  }
  if (!rectification) {
    return rectificationJsonResponse({ error: "La rectificación no existe." }, { status: 404 });
  }

  const { count, error: countError } = await authenticated.client
    .from("rectification_events")
    .select("id", { count: "exact", head: true })
    .eq("rectification_id", id);
  if (countError) {
    return databaseErrorResponse(
      "contar acontecimientos de rectificación",
      countError,
    );
  }
  if ((count ?? 0) >= 50) {
    return rectificationJsonResponse(
      { error: "Cada rectificación admite un máximo de 50 acontecimientos." },
      { status: 409 },
    );
  }

  const { data, error } = await authenticated.client
    .from("rectification_events")
    .insert({
      rectification_id: id,
      user_id: authenticated.userId,
      category: event.category,
      date_start: event.dateStart,
      date_end: event.dateEnd,
      date_precision: event.datePrecision,
      event_timezone: event.eventTimeZone,
      description: event.description,
      relevance: event.relevance,
    })
    .select("*")
    .single();
  if (error?.code === "23514") {
    return rectificationJsonResponse(
      { error: "Cada rectificación admite un máximo de 50 acontecimientos." },
      { status: 409 },
    );
  }
  if (error) return databaseErrorResponse("crear acontecimiento", error);

  return rectificationJsonResponse({ event: data }, { status: 201 });
}
