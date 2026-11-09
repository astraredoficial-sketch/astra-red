import {
  authenticateRectificationRequest,
  databaseErrorResponse,
  isUuid,
  readJsonBody,
  rectificationJsonResponse,
} from "@/lib/astro/rectification/server";
import { validateRectificationInput } from "@/lib/astro/rectification/validation";
import { generateBirthTimeCandidates } from "@/lib/astro/rectification/candidates";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(
  request: Request,
  context: RouteParams,
) {
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

  const { data, error } = await authenticated.client
    .from("natal_rectifications")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) return databaseErrorResponse("consultar rectificación", error);
  if (!data) {
    return rectificationJsonResponse({ error: "La rectificación no existe." }, { status: 404 });
  }

  return rectificationJsonResponse({ rectification: data });
}

export async function PUT(
  request: Request,
  context: RouteParams,
) {
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

  let input;
  try {
    input = validateRectificationInput(parsed.value);
    generateBirthTimeCandidates(
      input.intervalStart,
      input.intervalEnd,
      input.timeZone,
      input.stepMinutes,
    );
  } catch (error) {
    if (error instanceof RangeError) {
      return rectificationJsonResponse({ error: error.message }, { status: 400 });
    }
    throw error;
  }

  const { data, error } = await authenticated.client
    .from("natal_rectifications")
    .update({
      birth_date: input.birthDate,
      birth_city: input.birthCity,
      birth_country: input.birthCountry,
      birth_latitude: input.latitude,
      birth_longitude: input.longitude,
      birth_timezone: input.timeZone,
      interval_start_date: input.intervalStart.date,
      interval_start_time: input.intervalStart.time,
      interval_end_date: input.intervalEnd.date,
      interval_end_time: input.intervalEnd.time,
      candidate_step_minutes: input.stepMinutes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error) return databaseErrorResponse("actualizar rectificación", error);
  if (!data) {
    return rectificationJsonResponse({ error: "La rectificación no existe." }, { status: 404 });
  }

  return rectificationJsonResponse({ rectification: data });
}

export async function DELETE(
  request: Request,
  context: RouteParams,
) {
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

  const { data, error } = await authenticated.client
    .from("natal_rectifications")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle();
  if (error) return databaseErrorResponse("eliminar rectificación", error);
  if (!data) {
    return rectificationJsonResponse({ error: "La rectificación no existe." }, { status: 404 });
  }

  return new Response(null, { status: 204 });
}
