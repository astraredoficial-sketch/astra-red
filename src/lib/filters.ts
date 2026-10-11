import type { UserProfile } from "@/lib/types";

/**
 * Filtra los perfiles para mostrar solo quienes coincidan con las preferencias de búsqueda.
 */
export function filterProfilesForUser(me: UserProfile, candidates: UserProfile[]): UserProfile[] {
  return candidates.filter((other) => {
    // 1. Omitir al propio usuario
    if (other.id === me.id) return false;

    // 2. Filtro de género del usuario actual hacia el candidato
    if (me.targetGender !== "ambos" && other.gender !== me.targetGender) {
      return false;
    }

    // 3. Filtro recíproco (que el candidato también acepte el género del usuario actual)
    if (other.targetGender !== "ambos" && me.gender !== other.targetGender) {
      return false;
    }

    // 4. Coincidencia de intención (Amistad / Pareja)
    if (me.lookingFor !== "ambos" && other.lookingFor !== "ambos") {
      if (me.lookingFor !== other.lookingFor) return false;
    }

    return true;
  });
}

