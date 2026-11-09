import {
  authenticateRectificationRequest,
  databaseErrorResponse,
  isUuid,
  readJsonBody,
  rectificationJsonResponse,
} from "@/lib/astro/rectification/server";
import { validateRectificationEventInput } from "@/lib/astro/rectification/validation";

type RouteParams = { params: Promise<{ id: string; eventId: string }> };

export async function PATCH(request: Request, context: RouteParams) {
  const authenticated = await authenticateRectificationRequest(
    request.headers.get("authorization"),
  );
  if (!authenticated) {
    return rectificationJsonResponse({ error: "Inicia sesión para continuar." }, { status: 401 });
  }

  const { id, eventId } = await context.params;
  if (!isUuid(id) || !isUuid(eventId)) {
    return rectificationJsonResponse({ error: "El acontecimiento no es válido." }, { status: 400 });
  }

  const parsed = await readJsonBody(request);
  if ("response" in parsed) return parsed.response;

  let patch;
  try {
    patch = validateRectificationEventInput(parsed.value, true);
  } catch (error) {
    if (error instanceof RangeError) {
      return rectificationJsonResponse({ error: error.message }, { status: 400 });
    }
    throw error;
  }

  const { data: existing, error: readError } = await authenticated.client
    .from("rectification_events")
    .select("*")
    .eq("id", eventId)
    .eq("rectification_id", id)
    .maybeSingle();
  if (readError) return databaseErrorResponse("consultar acontecimiento", readError);
  if (!existing) {
    return rectificationJsonResponse({ error: "El acontecimiento no existe." }, { status: 404 });
  }

  let event;
  try {
    event = validateRectificationEventInput({
      category: patch.category ?? existing.category,
      dateStart: patch.dateStart ?? existing.date_start,
      dateEnd: patch.dateEnd ?? existing.date_end,
      datePrecision: patch.datePrecision ?? existing.date_precision,
      eventTimeZone:
        patch.eventTimeZone === undefined
          ? existing.event_timezone
          : patch.eventTimeZone,
      description:
        patch.description === undefined
          ? existing.description
          : patch.description,
      relevance: patch.relevance ?? existing.relevance,
    });
  } catch (error) {
    if (error instanceof RangeError) {
      return rectificationJsonResponse({ error: error.message }, { status: 400 });
    }
    throw error;
  }

  const { data, error } = await authenticated.client
    .from("rectification_events")
    .update({
      category: event.category,
      date_start: event.dateStart,
      date_end: event.dateEnd,
      date_precision: event.datePrecision,
      event_timezone: event.eventTimeZone,
      description: event.description,
      relevance: event.relevance,
      updated_at: new Date().toISOString(),
    })
    .eq("id", eventId)
    .eq("rectification_id", id)
    .select("*")
    .maybeSingle();
  if (error) return databaseErrorResponse("actualizar acontecimiento", error);
  if (!data) {
    return rectificationJsonResponse({ error: "El acontecimiento no existe." }, { status: 404 });
  }

  return rectificationJsonResponse({ event: data });
}

export async function DELETE(request: Request, context: RouteParams) {
  const authenticated = await authenticateRectificationRequest(
    request.headers.get("authorization"),
  );
  if (!authenticated) {
    return rectificationJsonResponse({ error: "Inicia sesión para continuar." }, { status: 401 });
  }

  const { id, eventId } = await context.params;
  if (!isUuid(id) || !isUuid(eventId)) {
    return rectificationJsonResponse({ error: "El acontecimiento no es válido." }, { status: 400 });
  }

  const { data, error } = await authenticated.client
    .from("rectification_events")
    .delete()
    .eq("id", eventId)
    .eq("rectification_id", id)
    .select("id")
    .maybeSingle();
  if (error) return databaseErrorResponse("eliminar acontecimiento", error);
  if (!data) {
    return rectificationJsonResponse({ error: "El acontecimiento no existe." }, { status: 404 });
  }

  return new Response(null, { status: 204 });
}
