const BLOCKED_TERMS = [
  "asshole",
  "bitch",
  "cabron",
  "cabrona",
  "cabrones",
  "cabrone",
  "cono",
  "cunt",
  "dick",
  "fuck",
  "fucking",
  "hijueputa",
  "maricon",
  "maricona",
  "mamaguevo",
  "malparido",
  "mierda",
  "nigga",
  "pendeja",
  "pendejo",
  "puta",
  "putas",
  "puto",
  "putos",
  "shit",
  "slut",
  "verga",
  "whore",
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
