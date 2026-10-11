export interface Account {
  id: string;
  name: string;
  email: string;
  avatar: string;
  location: string;
  membership: "vip" | "free";
  joinedDate: string;
  isCurrent: boolean;
  isComplete: boolean; // Controla si terminó el onboarding (ubicación y carta natal)
  birth_date?: string;
  birth_time?: string;
  birth_time_unknown?: boolean;
  location_country?: string;
  location_city?: string;
  chart?: unknown;

}

export const INITIAL_ACCOUNTS: Account[] = [
];

export function getAllAccounts(): Account[] {
  if (typeof window === "undefined") return INITIAL_ACCOUNTS;
  const stored = localStorage.getItem("astra_accounts");
  if (!stored) {
    return INITIAL_ACCOUNTS;
  }
  try {
    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) {
      throw new Error("El almacenamiento local de cuentas no tiene un formato válido.");
    }

    const accounts = parsed.flatMap((value): Account[] => {
      if (!value || typeof value !== "object") return [];
      const account = value as Record<string, unknown>;
      if (
        typeof account.id !== "string" ||
        typeof account.name !== "string" ||
        typeof account.email !== "string" ||
        typeof account.avatar !== "string" ||
        typeof account.location !== "string" ||
        (account.membership !== "vip" && account.membership !== "free") ||
        typeof account.joinedDate !== "string" ||
        typeof account.isCurrent !== "boolean"
      ) {
        return [];
      }

      return [{
        id: account.id,
        name: account.name,
        email: account.email,
        avatar: account.avatar,
        location: account.location,
        membership: account.membership,
        joinedDate: account.joinedDate,
        isCurrent: account.isCurrent,
        isComplete: account.isComplete === true,
      }];
    });

    localStorage.setItem("astra_accounts", JSON.stringify(accounts));
    return accounts;
  } catch (e) {
    console.error("No se pudieron leer las cuentas locales:", e);
    return INITIAL_ACCOUNTS;
  }
}

export function saveAccounts(accounts: Account[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem("astra_accounts", JSON.stringify(accounts));
  }
}

export function getCurrentAccount(): Account | null {
  const accounts = getAllAccounts();
  return accounts.find((a) => a.isCurrent) || null;
}
