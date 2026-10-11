import { UserProfile } from "./types";
import { SEED_PROFILES } from "./profiles";

const STORAGE_KEY = "astrared:profiles:v2";
const SWIPES_KEY = "astrared:swipes:v1";

export interface Store {
  profiles: UserProfile[];
  currentUserId?: string;
}

export type SwipeRecord = Record<string, "like" | "pass">;

export function loadStore(): Store {
  if (typeof window === "undefined") {
    return { profiles: SEED_PROFILES };
  }
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_PROFILES));
    return { profiles: SEED_PROFILES };
  }
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return { profiles: parsed };
    }
    return parsed;
  } catch {
    return { profiles: SEED_PROFILES };
  }
}

export function saveStore(store: Store): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function setActive(id: string): void {
  const store = loadStore();
  store.currentUserId = id;
  saveStore(store);
}

export function getStoredProfiles(): UserProfile[] {
  return loadStore().profiles;
}

export function saveProfile(profile: UserProfile): void {
  const store = loadStore();
  const index = store.profiles.findIndex((p) => p.id === profile.id);
  if (index >= 0) {
    store.profiles[index] = profile;
  } else {
    store.profiles.push(profile);
  }
  saveStore(store);
}

// --- GESTIÓN DE SWIPES (DESTINOS) ---
export function loadSwipes(): SwipeRecord {
  if (typeof window === "undefined") return {};
  const raw = localStorage.getItem(SWIPES_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function markSwipe(targetUserId: string, action: "like" | "pass"): void {
  if (typeof window === "undefined") return;
  const swipes = loadSwipes();
  swipes[targetUserId] = action;
  localStorage.setItem(SWIPES_KEY, JSON.stringify(swipes));
}

export function resetSwipes(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SWIPES_KEY);
}

