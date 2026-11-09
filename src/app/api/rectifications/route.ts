import { generateBirthTimeCandidates } from "@/lib/astro/rectification/candidates";
import {
  authenticateRectificationRequest,
  databaseErrorResponse,
  readJsonBody,
  rectificationJsonResponse,
} from "@/lib/astro/rectification/server";
import { validateRectificationInput } from "@/lib/astro/rectification/validation";

export async function GET(request: Request) {
  const authenticated = await authenticateRectificationRequest(
    request.headers.get("authorization"),
  );
  if (!authenticated) {
    return rectificationJsonResponse({ error: "Inicia sesión para continuar." }, { status: 401 });
  }

  const { data, error } = await authenticated.client
    .from("natal_rectifications")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) return databaseErrorResponse("listar rectificaciones", error);

  return rectificationJsonResponse({ rectifications: data });
}

export async function POST(request: Request) {
  const authenticated = await authenticateRectificationRequest(
    request.headers.get("authorization"),
  );
  if (!authenticated) {
    return rectificationJsonResponse({ error: "Inicia sesión para continuar." }, { status: 401 });
  }

  const parsed = await readJsonBody(request);
  if ("response" in parsed) return parsed.response;

  let input;
  let candidateSummary;
  try {
    input = validateRectificationInput(parsed.value);
    candidateSummary = generateBirthTimeCandidates(
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
    .insert({
      user_id: authenticated.userId,
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
    })
    .select("*")
    .single();
  if (error) return databaseErrorResponse("crear rectificación", error);

  return rectificationJsonResponse(
    {
      rectification: data,
      candidateSummary: {
        count: candidateSummary.candidates.length,
        skippedNonexistentLocalTimes:
          candidateSummary.skippedNonexistentLocalTimes,
        stepMinutes: candidateSummary.stepMinutes,
      },
    },
    { status: 201 },
  );
}
