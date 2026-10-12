import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
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

  const authorization = request.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return jsonResponse({ error: "Debes iniciar sesión para continuar." }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    console.error(
      "Falta configurar un secreto requerido para eliminar cuentas.",
    );
    return jsonResponse(
      { error: "El servicio de eliminación no está configurado." },
      500,
    );
  }

  const accessToken = authorization.slice("Bearer ".length);
  const userClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser(accessToken);
  if (userError || !user) {
    return jsonResponse({
      error: "La sesión no es válida. Vuelve a iniciar sesión.",
    }, 401);
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const photoPaths: string[] = [];

  async function collectPhotoPaths(folder: string) {
    let offset = 0;
    const pageSize = 100;

    while (true) {
      const { data: entries, error } = await adminClient.storage
        .from("profile-photos")
        .list(folder, { limit: pageSize, offset });

      if (error) {
        console.error(
          "No se pudieron enumerar las fotos para eliminar:",
          error,
        );
        throw new Error(
          "No se pudieron preparar todas las fotos para borrarlas.",
        );
      }

      for (const entry of entries) {
        const entryPath = `${folder}/${entry.name}`;
        if (entry.id === null) {
          await collectPhotoPaths(entryPath);
        } else {
          photoPaths.push(entryPath);
        }
      }

      if (entries.length < pageSize) break;
      offset += entries.length;
    }
  }

  try {
    await collectPhotoPaths(user.id);
  } catch (cause) {
    console.error(
      "No se pudieron recopilar todas las fotos de la cuenta:",
      cause,
    );
    return jsonResponse(
      {
        error:
          "No se eliminaron tus datos porque no se pudieron preparar todas tus fotos.",
      },
      500,
    );
  }

  for (let index = 0; index < photoPaths.length; index += 100) {
    const { error } = await adminClient.storage
      .from("profile-photos")
      .remove(photoPaths.slice(index, index + 100));

    if (error) {
      console.error("No se pudieron eliminar las fotos de la cuenta:", error);
      return jsonResponse(
        {
          error:
            "No se eliminaron tus datos porque no se pudieron borrar todas tus fotos. Puedes volver a intentarlo.",
        },
        500,
      );
    }
  }

  const { error: deleteUserError } = await adminClient.auth.admin.deleteUser(
    user.id,
  );
  if (deleteUserError) {
    console.error("No se pudo eliminar el usuario de Auth:", deleteUserError);
    return jsonResponse(
      {
        error:
          "No se pudieron eliminar los datos de la cuenta. Puedes volver a intentarlo.",
      },
      500,
    );
  }

  return jsonResponse(
    { success: "La cuenta y sus datos fueron eliminados." },
    200,
  );
});
