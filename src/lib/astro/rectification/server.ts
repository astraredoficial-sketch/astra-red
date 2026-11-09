import { createClient } from "@supabase/supabase-js";

export function rectificationJsonResponse(
  body: unknown,
  init?: ResponseInit,
): Response {
  const headers = new Headers(init?.headers);
  headers.set("Cache-Control", "private, no-store");
  return Response.json(body, { ...init, headers });
}

export async function authenticateRectificationRequest(
  authorization: string | null,
) {
  const match = authorization?.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !publishableKey) {
    throw new Error(
      "Configura la URL y la clave pública de Supabase para usar rectificación natal.",
    );
  }

  const accessToken = match[1];
  const client = createClient(url, publishableKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  const {
    data: { user },
    error,
  } = await client.auth.getUser(accessToken);

  if (error || !user) return null;
  return { client, userId: user.id };
}

export async function readJsonBody(
  request: Request,
  maximumBytes = 16_384,
): Promise<{ value: unknown } | { response: Response }> {
  const contentType = request.headers
    .get("content-type")
    ?.split(";")[0]
    .trim()
    .toLowerCase();
  if (contentType !== "application/json") {
    return {
      response: rectificationJsonResponse(
        { error: "El tipo de contenido debe ser JSON." },
        { status: 415 },
      ),
    };
  }

  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > maximumBytes) {
    return {
      response: rectificationJsonResponse(
        { error: "La solicitud supera el tamaño permitido." },
        { status: 413 },
      ),
    };
  }

  const reader = request.body?.getReader();
  if (!reader) {
    return {
      response: rectificationJsonResponse(
        { error: "La solicitud no contiene JSON válido." },
        { status: 400 },
      ),
    };
  }

  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;

      totalBytes += value.byteLength;
      if (totalBytes > maximumBytes) {
        await reader.cancel();
        return {
          response: rectificationJsonResponse(
            { error: "La solicitud supera el tamaño permitido." },
            { status: 413 },
          ),
        };
      }
      chunks.push(value);
    }
  } catch {
    return {
      response: rectificationJsonResponse(
        { error: "No se pudo leer el cuerpo de la solicitud." },
        { status: 400 },
      ),
    };
  }

  try {
    const bytes = new Uint8Array(totalBytes);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return { value: JSON.parse(new TextDecoder().decode(bytes)) as unknown };
  } catch {
    return {
      response: rectificationJsonResponse(
        { error: "La solicitud no contiene JSON válido." },
        { status: 400 },
      ),
    };
  }
}

export function databaseErrorResponse(
  operation: string,
  error: { code?: string },
): Response {
  console.error(
    `No se pudo completar ${operation} en rectificación natal:`,
    error.code ?? "error sin código",
  );
  return rectificationJsonResponse(
    { error: "No se pudo completar la operación. Inténtalo de nuevo." },
    { status: 500 },
  );
}

export function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value,
  );
}
