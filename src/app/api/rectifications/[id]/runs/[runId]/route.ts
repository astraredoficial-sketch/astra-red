import {
  authenticateRectificationRequest,
  databaseErrorResponse,
  isUuid,
  rectificationJsonResponse,
} from "@/lib/astro/rectification/server";

type RouteParams = { params: Promise<{ id: string; runId: string }> };

export async function GET(request: Request, context: RouteParams) {
  const authenticated = await authenticateRectificationRequest(
    request.headers.get("authorization"),
  );
  if (!authenticated) {
    return rectificationJsonResponse({ error: "Inicia sesión para continuar." }, { status: 401 });
  }

  const { id, runId } = await context.params;
  if (!isUuid(id) || !isUuid(runId)) {
    return rectificationJsonResponse({ error: "El resultado no es válido." }, { status: 400 });
  }

  const { data, error } = await authenticated.client
    .from("natal_rectification_runs")
    .select("id, methodology_version, status, candidate_count, event_count, score_gap, input_snapshot, results, created_at")
    .eq("rectification_id", id)
    .eq("id", runId)
    .maybeSingle();
  if (error) return databaseErrorResponse("consultar resultado de rectificación", error);
  if (!data) {
    return rectificationJsonResponse({ error: "El resultado no existe." }, { status: 404 });
  }

  return rectificationJsonResponse({ run: data });
}

export async function DELETE(request: Request, context: RouteParams) {
  const authenticated = await authenticateRectificationRequest(
    request.headers.get("authorization"),
  );
  if (!authenticated) {
    return rectificationJsonResponse({ error: "Inicia sesión para continuar." }, { status: 401 });
  }

  const { id, runId } = await context.params;
  if (!isUuid(id) || !isUuid(runId)) {
    return rectificationJsonResponse({ error: "El resultado no es válido." }, { status: 400 });
  }

  const { data, error } = await authenticated.client
    .from("natal_rectification_runs")
    .delete()
    .eq("rectification_id", id)
    .eq("id", runId)
    .select("id")
    .maybeSingle();
  if (error) return databaseErrorResponse("eliminar resultado de rectificación", error);
  if (!data) {
    return rectificationJsonResponse({ error: "El resultado no existe." }, { status: 404 });
  }

  return new Response(null, { status: 204 });
}
