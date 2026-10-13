const BLOCKED_TERMS = [
  "asshole",
  "bitch",
  "cabron",
  "cabrona",
  "cabrones",
  "cabrone",
  "cagada",
  "cagado",
  "cagar",
  "cagando",
  "cagon",
  "cagona",
  "carajo",
  "careverga",
  "chinga",
  "chingada",
  "chingado",
  "chingando",
  "chingar",
  "chingas",
  "chingue",
  "chingues",
  "cono",
  "cunt",
  "culera",
  "culero",
  "culiada",
  "culiao",
  "coger",
  "dick",
  "follar",
  "fuck",
  "fucking",
  "gonorrea",
  "hijueputa",
  "hijueperra",
  "hijuepucha",
  "jodida",
  "jodido",
  "joder",
  "jodete",
  "malparida",
  "malparidos",
  "mamon",
  "maricon",
  "maricona",
  "mamaguevo",
  "malparido",
  "mierda",
  "nigga",
  "pendeja",
  "pendejo",
  "pendejada",
  "pendejadas",
  "picha",
  "pichula",
  "pija",
  "pinga",
  "puta",
  "putas",
  "puto",
  "putos",
  "putear",
  "puteria",
  "shit",
  "slut",
  "sexo",
  "tirar",
  "verga",
  "whore",
  "zorra",
];

function normalizeMessage(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[013457@$]/g, (character) => {
      const replacements: Record<string, string> = {
        "0": "o",
        "1": "i",
        "3": "e",
        "4": "a",
        "5": "s",
        "7": "t",
        "@": "a",
        "$": "s",
      };
      return replacements[character] ?? character;
    })
    .replace(/([a-z])\1{2,}/g, "$1$1")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function containsObsceneLanguage(text: string): boolean {
  const normalized = ` ${normalizeMessage(text)} `;
  return BLOCKED_TERMS.some((term) => normalized.includes(` ${term} `));
}
