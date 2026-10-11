import { loadStore } from "./storage";
import { SEED_PROFILES } from "./profiles";
import type { UserProfile } from "./types";

export function findProfile(id: string): UserProfile | undefined {
  const store = loadStore();
  const local = store.profiles.find((p) => p.id === id);
  if (local) return local;

  return SEED_PROFILES.find((p) => p.id === id);
}

