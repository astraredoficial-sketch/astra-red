export type PlanetId =
  | "sun"
  | "moon"
  | "mercury"
  | "venus"
  | "mars"
  | "jupiter"
  | "saturn"
  | "uranus"
  | "neptune"
  | "pluto"
  | "node"
  | "asc";

export type AspectName =
  | "conjunction"
  | "sextile"
  | "square"
  | "trine"
  | "opposition";

export type Placement = {
  id: PlanetId;
  longitude: number;
  sign: string;
  signIndex: number;
  degreeInSign: number;
  house: number;
};

export type NatalChart = {
  generatedAt: string;
  julianDay: number;
  houses: number[];
  planets: Placement[];
  triad: {
    sun: Placement;
    moon: Placement;
    asc: Placement;
  };
  timeUnknown: boolean;
};

export type BirthData = {
  date: string;
  time: string;
  cityId: string;
  timeUnknown: boolean;
  location?: {
    latitude: number;
    longitude: number;
    timeZone: string;
  };
};

// --- NUEVOS TIPOS PARA FILTROS Y REGISTRO ---
export type Gender = "hombre" | "mujer" | "otro";
export type TargetGender = "hombre" | "mujer" | "ambos";
export type LookingFor = "amistad" | "pareja" | "ambos";

export type PhoneData = {
  countryCode: string; // Ej: "+58"
  number: string;      // Número móvil
  whatsappAlerts: boolean; // Consentimiento para recibir alarmas de calendario
};

export type UserProfile = {
  id: string;
  name: string;
  gender: Gender;
  lookingFor: LookingFor;
  targetGender: TargetGender;
  locationCity: string;
  locationCountry: string;
  chart: NatalChart;
};

export type SynastryAspect = {
  a: PlanetId;
  b: PlanetId;
  type: AspectName;
  orb: number;
  exactAngle: number;
};

export type SynastryResult = {
  percent: number;
  aspects: SynastryAspect[];
  hasNodalAspect: boolean;
  hiloRojo: boolean;
};
