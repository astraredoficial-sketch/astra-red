import type { UserProfile } from "./types";

export const SEED_PROFILES: UserProfile[] = [
  {
    id: "user-1",
    name: "Elena Ramos",
    bio: "Amante del arte visual, el café de especialidad y la astrología psicológica.",
    gender: "mujer",
    lookingFor: "pareja",
    targetGender: "hombre",
    phone: { countryCode: "+58", number: "4121112233", whatsappAlerts: true },
    birth: { date: "1992-04-12", time: "14:30", cityId: "caracas-ve" },
    chart: {
      generatedAt: new Date().toISOString(),
      julianDay: 2460000.5,
      houses: [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330],
      planets: [],
      triad: {
        sun: { id: "sun", longitude: 22, sign: "Aries", signIndex: 0, degreeInSign: 22, house: 9 },
        moon: { id: "moon", longitude: 120, sign: "Leo", signIndex: 4, degreeInSign: 0, house: 1 },
        asc: { id: "asc", longitude: 210, sign: "Escorpio", signIndex: 7, degreeInSign: 0, house: 1 },
      },
      timeUnknown: false,
    },
  },
  {
    id: "user-2",
    name: "Carlos Mendoza",
    bio: "Melómano, aficionado a las caminatas en la montaña y discusiones sobre sinastría.",
    gender: "hombre",
    lookingFor: "pareja",
    targetGender: "mujer",
    phone: { countryCode: "+57", number: "3009876543", whatsappAlerts: true },
    birth: { date: "1988-09-03", time: "08:15", cityId: "bogota-co" },
    chart: {
      generatedAt: new Date().toISOString(),
      julianDay: 2460000.5,
      houses: [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330],
      planets: [],
      triad: {
        sun: { id: "sun", longitude: 160, sign: "Virgo", signIndex: 5, degreeInSign: 10, house: 12 },
        moon: { id: "moon", longitude: 65, sign: "Géminis", signIndex: 2, degreeInSign: 5, house: 9 },
        asc: { id: "asc", longitude: 180, sign: "Libra", signIndex: 6, degreeInSign: 0, house: 1 },
      },
      timeUnknown: false,
    },
  },
  {
    id: "user-3",
    name: "Sofia Silva",
    bio: "Diseñadora UX/UI. Buscando conexiones genuinas e inspiración cósmica.",
    gender: "mujer",
    lookingFor: "ambos",
    targetGender: "todos",
    phone: { countryCode: "+58", number: "4245556677", whatsappAlerts: true },
    birth: { date: "1995-11-20", time: "21:00", cityId: "caracas-ve" },
    chart: {
      generatedAt: new Date().toISOString(),
      julianDay: 2460000.5,
      houses: [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330],
      planets: [],
      triad: {
        sun: { id: "sun", longitude: 235, sign: "Escorpio", signIndex: 7, degreeInSign: 25, house: 5 },
        moon: { id: "moon", longitude: 300, sign: "Acuario", signIndex: 10, degreeInSign: 0, house: 8 },
        asc: { id: "asc", longitude: 90, sign: "Cáncer", signIndex: 3, degreeInSign: 0, house: 1 },
      },
      timeUnknown: false,
    },
  },
];

export const seedProfiles = SEED_PROFILES;
