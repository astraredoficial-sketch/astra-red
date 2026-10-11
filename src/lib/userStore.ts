export interface Account {
  id: string;
  name: string;
  email: string;
  password?: string;
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
  chart?: any;

}

export const INITIAL_ACCOUNTS: Account[] = [
  {
    id: "acc-1",
    name: "Aaron Montilla",
    email: "aaron.montilla@astrared.com",
    password: "password123",
    avatar: "🧙‍♂️",
    location: "Barinas, Venezuela",
    membership: "free",
    joinedDate: "2026",
    isCurrent: true,
    isComplete: true
  }
];

export function getAllAccounts(): Account[] {
  if (typeof window === "undefined") return INITIAL_ACCOUNTS;
  const stored = localStorage.getItem("astra_accounts");
  if (!stored) {
    localStorage.setItem("astra_accounts", JSON.stringify(INITIAL_ACCOUNTS));
    return INITIAL_ACCOUNTS;
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
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


