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
  return { admin, user };
}
