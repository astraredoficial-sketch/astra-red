import "server-only";

import { createClient } from "@supabase/supabase-js";

export function createProfilePhotosAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Configura NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY para procesar fotos de perfil.",
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function authenticateProfilePhotoRequest(
  authorization: string | null,
) {
  const match = authorization?.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;

  const admin = createProfilePhotosAdminClient();
  const {
    data: { user },
    error,
  } = await admin.auth.getUser(match[1]);

  if (error || !user) return null;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !publishableKey) {
    throw new Error(
      "Configura la URL y la clave pública de Supabase para validar el acceso a fotos.",
    );
  }

  const viewer = createClient(supabaseUrl, publishableKey, {
    global: { headers: { Authorization: `Bearer ${match[1]}` } },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return { admin, user, viewer };
}
