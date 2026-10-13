import { createClient } from "npm:@supabase/supabase-js@2";
import { containsObsceneLanguage } from "./chat-safety.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type JsonObject = Record<string, unknown>;

function isObject(value: unknown): value is JsonObject {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function jsonResponse(body: JsonObject, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (request.method !== "POST") {
    return jsonResponse({ error: "Método no permitido." }, 405);
  }

  const authorization = request.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return jsonResponse({ error: "Debes iniciar sesión para continuar." }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    console.error("Falta configurar un secreto requerido para chat-assistant.");
    return jsonResponse(
      { error: "El asistente de chat no está configurado." },
      500,
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "La solicitud no contiene JSON válido." }, 400);
  }
  if (
    !isObject(body) ||
    typeof body.action !== "string" ||
    typeof body.recipientId !== "string"
  ) {
    return jsonResponse({ error: "La acción solicitada no es válida." }, 400);
  }

  const accessToken = authorization.slice("Bearer ".length);
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const {
    data: { user },
    error: authError,
  } = await userClient.auth.getUser(accessToken);
  if (authError || !user) {
    return jsonResponse(
      { error: "La sesión no es válida. Vuelve a iniciar sesión." },
      401,
    );
  }

  const recipientId = body.recipientId;
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      recipientId,
    ) ||
    recipientId === user.id
  ) {
    return jsonResponse({ error: "El destino de la conversación no es válido." }, 400);
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  if (body.action === "block-user") {
    const { error: blockError } = await adminClient
      .from("chat_user_blocks")
      .upsert(
        { blocker_id: user.id, blocked_user_id: recipientId },
        { onConflict: "blocker_id,blocked_user_id", ignoreDuplicates: true },
      );
    if (blockError) {
      console.error("No se pudo bloquear al usuario:", blockError);
      return jsonResponse({ error: "No se pudo bloquear esta cuenta." }, 500);
    }
    return jsonResponse({ success: true });
  }

  if (
    body.action !== "send-message" &&
    body.action !== "report-user"
  ) {
    return jsonResponse({ error: "La acción solicitada no es válida." }, 400);
  }

  const [userA, userB] = [user.id, recipientId].sort();
  const { data: match, error: matchError } = await userClient
    .from("matches")
    .select("user_a")
    .eq("user_a", userA)
    .eq("user_b", userB)
    .maybeSingle();
  if (matchError) {
    console.error("No se pudo comprobar la conexión del chat:", matchError);
    return jsonResponse({ error: "No se pudo verificar esta conversación." }, 500);
  }
  if (!match) {
    return jsonResponse(
      { error: "Esta acción requiere una conexión mutua." },
      403,
    );
  }

  if (body.action === "report-user") {
    const validReasons = ["obscene", "harassment", "spam", "other"];
    if (typeof body.reason !== "string" || !validReasons.includes(body.reason)) {
      return jsonResponse({ error: "Selecciona un motivo válido." }, 400);
    }

    const { error: reportError } = await adminClient
      .from("chat_user_reports")
      .insert({
        reporter_id: user.id,
        reported_user_id: recipientId,
        reason: body.reason,
      });
    if (reportError) {
      console.error("No se pudo registrar el reporte del chat:", reportError);
      return jsonResponse({ error: "No se pudo enviar el reporte." }, 500);
    }
    return jsonResponse({ success: true });
  }

  if (
    typeof body.text !== "string" ||
    body.text.trim().length === 0 ||
    body.text.length > 2000
  ) {
    return jsonResponse({ error: "El mensaje no es válido." }, 400);
  }

  const [ownBlock, otherBlock] = await Promise.all([
    userClient
      .from("chat_user_blocks")
      .select("blocker_id")
      .eq("blocker_id", user.id)
      .eq("blocked_user_id", recipientId)
      .maybeSingle(),
    userClient
      .from("chat_user_blocks")
      .select("blocker_id")
      .eq("blocker_id", recipientId)
      .eq("blocked_user_id", user.id)
      .maybeSingle(),
  ]);
  if (ownBlock.error || otherBlock.error) {
    console.error(
      "No se pudo comprobar el estado de bloqueo:",
      ownBlock.error ?? otherBlock.error,
    );
    return jsonResponse({ error: "No se pudo verificar este chat." }, 500);
  }
  if (ownBlock.data || otherBlock.data) {
    return jsonResponse(
      { error: "No se pueden enviar mensajes en esta conversación." },
      403,
    );
  }

  const { data: allowed, error: rateLimitError } = await userClient.rpc(
    "consume_chat_ai_request",
  );
  if (rateLimitError) {
    console.error("No se pudo comprobar el límite de mensajes:", rateLimitError);
    return jsonResponse(
      { error: "No se pudo verificar el límite de mensajes del chat." },
      503,
    );
  }
  if (allowed !== true) {
    return jsonResponse(
      { error: "Alcanzaste el límite temporal de mensajes. Inténtalo más tarde." },
      429,
    );
  }

  if (containsObsceneLanguage(body.text)) {
    return jsonResponse(
      {
        error:
          "El mensaje parece contener lenguaje obsceno u ofensivo. Edítalo e inténtalo de nuevo.",
      },
      422,
    );
  }

  const { data: message, error: insertError } = await adminClient
    .from("chat_messages")
    .insert({
      sender_id: user.id,
      recipient_id: recipientId,
      body: body.text.trim(),
    })
    .select("id, sender_id, recipient_id, body, created_at, read_at")
    .single();
  if (insertError) {
    console.error("No se pudo guardar un mensaje revisado:", insertError);
    return jsonResponse({ error: "No se pudo guardar el mensaje." }, 500);
  }
  return jsonResponse({ message });
});
