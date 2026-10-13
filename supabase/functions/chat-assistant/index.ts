import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SIGNS = new Set([
  "Aries",
  "Tauro",
  "Géminis",
  "Cáncer",
  "Leo",
  "Virgo",
  "Libra",
  "Escorpio",
  "Sagitario",
  "Capricornio",
  "Acuario",
  "Piscis",
]);

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

function chartSigns(chart: unknown) {
  if (!isObject(chart) || !isObject(chart.triad)) return null;
  const sun = chart.triad.sun;
  const moon = chart.triad.moon;
  if (
    !isObject(sun) ||
    !isObject(moon) ||
    typeof chart.timeUnknown !== "boolean" ||
    typeof sun.sign !== "string" ||
    typeof moon.sign !== "string" ||
    !SIGNS.has(sun.sign) ||
    !SIGNS.has(moon.sign)
  ) {
    return null;
  }
  return {
    sun: sun.sign,
    moon: moon.sign,
    timeUnknown: chart.timeUnknown,
  };
}

async function moderateText(apiKey: string, text: string) {
  let response: Response;
  try {
    response = await fetch("https://api.openai.com/v1/moderations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "omni-moderation-latest",
        input: text,
      }),
    });
  } catch (cause) {
    console.error("No se pudo conectar con el servicio de moderación:", cause);
    throw new Error("El filtro de seguridad no está disponible.");
  }

  if (!response.ok) {
    console.error("El servicio de moderación respondió:", response.status);
    throw new Error("No se pudo revisar el mensaje.");
  }

  let result: unknown;
  try {
    result = await response.json();
  } catch (cause) {
    console.error("El servicio de moderación devolvió JSON inválido:", cause);
    throw new Error("No se pudo interpretar la revisión del mensaje.");
  }

  if (
    !isObject(result) ||
    !Array.isArray(result.results) ||
    !isObject(result.results[0]) ||
    !isObject(result.results[0].categories)
  ) {
    console.error("El servicio de moderación devolvió una respuesta incompleta.");
    throw new Error("No se pudo interpretar la revisión del mensaje.");
  }

  const categories = result.results[0].categories;
  return (
    categories.sexual === true ||
    categories["sexual/minors"] === true ||
    categories.harassment === true ||
    categories["harassment/threatening"] === true
  );
}

async function getIcebreakers(
  apiKey: string,
  model: string,
  signs: {
    ownSun: string;
    otherSun: string;
    ownMoon?: string;
    otherMoon?: string;
  },
) {
  let response: Response;
  try {
    response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.8,
        max_tokens: 220,
        store: false,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "Eres el asistente amable de AstraRed. Devuelve un objeto JSON con la propiedad icebreakers, un arreglo de exactamente 3 preguntas breves en español para iniciar una conversación respetuosa y natural. Usa solo los datos astrológicos proporcionados como inspiración ligera; omite signos que no estén incluidos. No escribas contenido sexual, vulgar, invasivo ni afirmaciones deterministas. No pidas datos personales.",
          },
          {
            role: "user",
            content: JSON.stringify(signs),
          },
        ],
      }),
    });
  } catch (cause) {
    console.error("No se pudo conectar con el generador de rompehielos:", cause);
    throw new Error("No se pudieron generar sugerencias en este momento.");
  }

  if (!response.ok) {
    console.error("El generador de rompehielos respondió:", response.status);
    throw new Error("No se pudieron generar sugerencias en este momento.");
  }

  let result: unknown;
  try {
    result = await response.json();
  } catch (cause) {
    console.error("El generador de rompehielos devolvió JSON inválido:", cause);
    throw new Error("No se pudieron interpretar las sugerencias.");
  }

  if (
    !isObject(result) ||
    !Array.isArray(result.choices) ||
    !isObject(result.choices[0]) ||
    !isObject(result.choices[0].message) ||
    typeof result.choices[0].message.content !== "string"
  ) {
    console.error("El generador de rompehielos devolvió una respuesta incompleta.");
    throw new Error("No se pudieron interpretar las sugerencias.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(result.choices[0].message.content);
  } catch (cause) {
    console.error("El generador de rompehielos devolvió JSON inválido:", cause);
    throw new Error("No se pudieron interpretar las sugerencias.");
  }

  if (
    !isObject(parsed) ||
    !Array.isArray(parsed.icebreakers) ||
    parsed.icebreakers.length !== 3 ||
    !parsed.icebreakers.every(
      (item) => typeof item === "string" && item.trim().length > 0 && item.length <= 180,
    )
  ) {
    console.error("El generador de rompehielos devolvió sugerencias inválidas.");
    throw new Error("No se pudieron interpretar las sugerencias.");
  }

  const suggestions = parsed.icebreakers.map((item) => {
    if (typeof item !== "string") {
      throw new Error("Las sugerencias generadas no son válidas.");
    }
    return item.trim();
  });
  const blocked = await moderateText(apiKey, suggestions.join("\n"));
  if (blocked) {
    throw new Error("Las sugerencias generadas no pasaron el filtro de seguridad.");
  }
  return suggestions;
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
  const openAiApiKey = Deno.env.get("OPENAI_API_KEY");
  if (!supabaseUrl || !anonKey || !serviceRoleKey || !openAiApiKey) {
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
  if (!isObject(body) || typeof body.action !== "string") {
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

  if (
    (body.action !== "send-message" && body.action !== "icebreakers") ||
    typeof body.recipientId !== "string"
  ) {
    return jsonResponse({ error: "La acción solicitada no es válida." }, 400);
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

  const [userA, userB] = [user.id, recipientId].sort();
  const { data: match, error: matchError } = await userClient
    .from("matches")
    .select("user_a")
    .eq("user_a", userA)
    .eq("user_b", userB)
    .maybeSingle();
  if (matchError) {
    console.error("No se pudo comprobar la conexión para las sugerencias:", matchError);
    return jsonResponse({ error: "No se pudo verificar esta conversación." }, 500);
  }
  if (!match) {
    return jsonResponse(
      { error: "Las sugerencias solo están disponibles para conexiones mutuas." },
      403,
    );
  }

  const { data: allowed, error: rateLimitError } = await userClient.rpc(
    "consume_chat_ai_request",
  );
  if (rateLimitError) {
    console.error("No se pudo comprobar el límite del asistente:", rateLimitError);
    return jsonResponse(
      { error: "No se pudo verificar el límite de uso del chat." },
      503,
    );
  }
  if (allowed !== true) {
    return jsonResponse(
      { error: "Alcanzaste el límite temporal del asistente. Inténtalo más tarde." },
      429,
    );
  }

  if (body.action === "send-message") {
    if (
      typeof body.text !== "string" ||
      body.text.trim().length === 0 ||
      body.text.length > 2000
    ) {
      return jsonResponse({ error: "El mensaje no es válido." }, 400);
    }

    try {
      const blocked = await moderateText(openAiApiKey, body.text.trim());
      if (blocked) {
        return jsonResponse(
          { error: "No se permiten mensajes sexuales explícitos ni de acoso." },
          422,
        );
      }
    } catch (cause) {
      console.error("Falló la moderación de un mensaje.");
      return jsonResponse(
        {
          error:
            cause instanceof Error
              ? cause.message
              : "El filtro de seguridad no está disponible.",
        },
        503,
      );
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
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
      console.error("No se pudo guardar un mensaje moderado:", insertError);
      return jsonResponse({ error: "No se pudo guardar el mensaje." }, 500);
    }
    return jsonResponse({ message });
  }

  const { data: profiles, error: profilesError } = await userClient
    .from("profiles")
    .select("id, chart")
    .in("id", [user.id, recipientId]);
  if (profilesError) {
    console.error("No se pudieron leer las cartas para las sugerencias:", profilesError);
    return jsonResponse({ error: "No se pudieron preparar las sugerencias." }, 500);
  }

  const ownProfile = profiles.find((profile) => profile.id === user.id);
  const otherProfile = profiles.find((profile) => profile.id === recipientId);
  const ownSigns = chartSigns(ownProfile?.chart);
  const otherSigns = chartSigns(otherProfile?.chart);
  if (!ownSigns || !otherSigns) {
    return jsonResponse(
      { error: "No hay suficientes datos de carta para crear sugerencias." },
      422,
    );
  }

  try {
    const signs = {
      ownSun: ownSigns.sun,
      otherSun: otherSigns.sun,
      ...(!ownSigns.timeUnknown && !otherSigns.timeUnknown
        ? { ownMoon: ownSigns.moon, otherMoon: otherSigns.moon }
        : {}),
    };
    const suggestions = await getIcebreakers(
      openAiApiKey,
      Deno.env.get("OPENAI_CHAT_MODEL") || "gpt-4o-mini",
      signs,
    );
    return jsonResponse({ suggestions });
  } catch (cause) {
    console.error("No se pudieron preparar los rompehielos:", cause);
    return jsonResponse(
      {
        error:
          cause instanceof Error
            ? cause.message
            : "No se pudieron generar sugerencias.",
      },
      503,
    );
  }
});
