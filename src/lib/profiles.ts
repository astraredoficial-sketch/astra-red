import { BirthData, TargetGender, UserProfile } from "./types";

export const SEED_PROFILES: UserProfile[] = [];

export function createDefaultBirthData(): BirthData {
  return {
    date: "2000-01-01",
    time: "12:00",
    cityId: "",
    timeUnknown: false,
  };
}

export function validateBirthData(data: Partial<BirthData>): BirthData {
  return {
    date: data.date || "2000-01-01",
    time: data.time || "12:00",
    cityId: data.cityId || "",
    timeUnknown: data.timeUnknown ?? false,
  };
}

export function normalizeTargetGender(gender: string): any {
  if (gender === "todos" || gender === "otro" || gender === "hombre" || gender === "mujer") {
    return gender;
  }
  return "todos";
}
