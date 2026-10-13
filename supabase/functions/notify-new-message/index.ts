import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cron-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type EmailNotification = {
  key: string;
  type: "message" | "match" | "astral";
  recipientId: string;
  email: string;
  subject: string;
  text: string;
};

function jsonResponse(body: Record<string, string>, status: number) {
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

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const mailtrapApiToken = Deno.env.get("MAILTRAP_API_TOKEN");
  const fromEmail = Deno.env.get("MAILTRAP_FROM_EMAIL");
  const appUrl = Deno.env.get("APP_URL");
  if (
    !supabaseUrl ||
    !anonKey ||
    !serviceRoleKey ||
    !mailtrapApiToken ||
    !fromEmail ||
    !appUrl
  ) {
    console.error("Falta configurar uno o más secretos de notify-new-message.");
    return jsonResponse(
      { error: "El servicio de notificaciones no está configurado." },
      500,
    );
  }
  const configuredMailtrapApiToken = mailtrapApiToken;

  let requestBody: unknown;
  try {
    requestBody = await request.json();
  } catch {
    return jsonResponse(
      { error: "La solicitud no contiene JSON válido." },
      400,
    );
  }
  if (
    requestBody === null ||
    typeof requestBody !== "object" ||
    !("event" in requestBody) ||
    typeof requestBody.event !== "string"
  ) {
    return jsonResponse(
      { error: "El tipo de notificación no es válido." },
      400,
    );
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const messageUrl = new URL("/mensajes", appUrl).toString();
  const calendarUrl = new URL("/calendario", appUrl).toString();

  async function sendNotification(notification: EmailNotification) {
    const { error: claimError } = await adminClient
      .from("app_email_notifications")
      .insert({
        notification_key: notification.key,
        event_type: notification.type,
        recipient_id: notification.recipientId,
      });

    if (claimError?.code === "23505") return "already-sent" as const;
    if (claimError) {
      console.error("No se pudo reservar el aviso por correo:", claimError);
      throw new Error("No se pudo preparar el aviso por correo.");
    }

    async function releaseClaim() {
      const { error } = await adminClient
        .from("app_email_notifications")
        .delete()
        .eq("notification_key", notification.key);
      if (error) {
        console.error("No se pudo liberar el aviso para reintentar:", error);
      }
    }

    let response: Response;
    try {
      response = await fetch("https://send.api.mailtrap.io/api/send", {
        method: "POST",
        headers: {
          "Api-Token": configuredMailtrapApiToken,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          from: { name: "AstraRed", email: fromEmail },
          to: [{ email: notification.email }],
          subject: notification.subject,
          text: notification.text,
        }),
      });
    } catch (cause) {
      await releaseClaim();
      console.error("No se pudo conectar con Mailtrap:", cause);
      throw new Error("No se pudo conectar con el proveedor de correo.");
    }

    if (!response.ok) {
      const details = await response.text();
      await releaseClaim();
      console.error(
        "Mailtrap no pudo enviar el aviso:",
        response.status,
        details,
      );
      throw new Error("Mailtrap no pudo enviar el aviso.");
    }

    return "sent" as const;
  }

  async function getAccount(userId: string) {
    const [{ data, error }, { data: profile, error: profileError }] =
      await Promise.all([
        adminClient.auth.admin.getUserById(userId),
        adminClient
          .from("profiles")
          .select("name")
          .eq("id", userId)
          .maybeSingle(),
      ]);

    if (error || !data.user?.email) {
      console.error("No se pudo obtener el correo de la cuenta:", error);
      throw new Error("No se pudo obtener el correo del destinatario.");
    }
    if (profileError) {
      console.error("No se pudo obtener el perfil de la cuenta:", profileError);
      throw new Error("No se pudo obtener el perfil del destinatario.");
    }

    return {
      email: data.user.email,
      name: profile?.name?.trim() || "Alguien",
    };
  }

  if (requestBody.event === "astral-reminders") {
    const cronSecret = Deno.env.get("CRON_SECRET");
    if (
      !cronSecret ||
      request.headers.get("x-cron-secret") !== cronSecret
    ) {
      return jsonResponse({ error: "No autorizado." }, 401);
    }

    const reminderDate = new Date();
    reminderDate.setUTCDate(reminderDate.getUTCDate() + 1);
    const eventDate = reminderDate.toISOString().slice(0, 10);
    let offset = 0;
    let sent = 0;
    let failed = 0;

    while (true) {
      const { data: events, error } = await adminClient
        .from("astral_events")
        .select("id, user_id, title, event_date, lunar_phase, recommendation")
        .eq("event_date", eventDate)
        .order("id", { ascending: true })
        .range(offset, offset + 99);

      if (error) {
        console.error("No se pudieron cargar las fechas astrales:", error);
        return jsonResponse(
          { error: "No se pudieron cargar las fechas astrales." },
          500,
        );
      }
      if (!events?.length) break;

      for (const event of events) {
        try {
          const account = await getAccount(event.user_id);
          const result = await sendNotification({
            key: `astral:${event.id}`,
            type: "astral",
            recipientId: event.user_id,
            email: account.email,
            subject: `Mañana: ${event.title} · AstraRed`,
            text:
              `Mañana tienes una fecha astral guardada: ${event.title}.\n\nFase lunar: ${event.lunar_phase}.\n${event.recommendation}\n\nConsulta tu calendario: ${calendarUrl}`,
          });
          if (result === "sent") sent += 1;
        } catch (cause) {
          failed += 1;
          console.error(
            `Falló el aviso de la fecha astral ${event.id}:`,
            cause,
          );
        }
      }

      if (events.length < 100) break;
      offset += events.length;
    }

    if (failed > 0) {
      return jsonResponse(
        {
          error:
            `Se enviaron ${sent} avisos astrales y fallaron ${failed}; revisa los registros y vuelve a ejecutar la tarea.`,
        },
        502,
      );
    }
    return jsonResponse(
      { success: `Se enviaron ${sent} avisos astrales.` },
      200,
    );
  }

  const authorization = request.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return jsonResponse({ error: "Debes iniciar sesión." }, 401);
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: authorization } },
  });
  const { data: userData, error: userError } = await userClient.auth.getUser(
    authorization.slice("Bearer ".length),
  );
  if (userError || !userData.user) {
    return jsonResponse({ error: "La sesión no es válida." }, 401);
  }

  if (
    requestBody.event === "message" &&
    "messageId" in requestBody &&
    typeof requestBody.messageId === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      requestBody.messageId,
    )
  ) {
    const { data: message, error } = await adminClient
      .from("chat_messages")
      .select("id, sender_id, recipient_id")
      .eq("id", requestBody.messageId)
      .maybeSingle();
    if (error) {
      console.error("No se pudo comprobar el mensaje:", error);
      return jsonResponse({ error: "No se pudo comprobar el mensaje." }, 500);
    }
    if (!message || message.sender_id !== userData.user.id) {
      return jsonResponse(
        { error: "El mensaje no pertenece a esta sesión." },
        403,
      );
    }

    const [sender, recipient] = await Promise.all([
      getAccount(message.sender_id),
      getAccount(message.recipient_id),
    ]);
    await sendNotification({
      key: `message:${message.id}`,
      type: "message",
      recipientId: message.recipient_id,
      email: recipient.email,
      subject: "Tienes un nuevo mensaje en AstraRed",
      text:
        `${sender.name} te ha enviado un mensaje en AstraRed.\n\nEntra en tu bandeja de mensajes para leerlo: ${messageUrl}`,
    });
    return jsonResponse({ success: "Notificación enviada." }, 200);
  }

  if (
    requestBody.event === "match" &&
    "otherUserId" in requestBody &&
    typeof requestBody.otherUserId === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      requestBody.otherUserId,
    ) &&
    requestBody.otherUserId !== userData.user.id
  ) {
    const [userA, userB] = [
      userData.user.id,
      requestBody.otherUserId,
    ].sort();
    const { data: match, error } = await adminClient
      .from("matches")
      .select("user_a, user_b")
      .eq("user_a", userA)
      .eq("user_b", userB)
      .maybeSingle();
    if (error) {
      console.error("No se pudo comprobar la conexión mutua:", error);
      return jsonResponse(
        { error: "No se pudo comprobar la conexión mutua." },
        500,
      );
    }
    if (!match) {
      return jsonResponse({ error: "La conexión mutua no existe." }, 403);
    }

    const accounts = await Promise.all([getAccount(userA), getAccount(userB)]);
    const results = await Promise.all(
      [userA, userB].map((recipientId, index) =>
        sendNotification({
          key: `match:${userA}:${userB}:${recipientId}`,
          type: "match",
          recipientId,
          email: accounts[index].email,
          subject: "¡Tienes una nueva conexión en AstraRed!",
          text: `Tú y ${
            accounts[index === 0 ? 1 : 0].name
          } se han gustado mutuamente.\n\nEmpieza la conversación: ${messageUrl}`,
        })
      ),
    );
    return jsonResponse(
      {
        success: `Se enviaron ${
          results.filter((result) => result === "sent").length
        } avisos de conexión.`,
      },
      200,
    );
  }

  return jsonResponse({ error: "El tipo de notificación no es válido." }, 400);
});
