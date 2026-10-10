// Código corregido para src/hooks/useSession.ts
import { useState, useEffect } from "react";
import { UserProfile } from "../lib/types";

export interface Store {
  refresh: () => void;
  ready: boolean;
  store: any | null;
  me: UserProfile | null;
}

export function useSession() {
  const [session, setSession] = useState<{
    ready: boolean;
    store: Store | null;
    me: UserProfile | null;
  }>({
    ready: true,
    store: null,
    me: null,
  });

  return {
    ...session,
    refresh: () => {},
  };
}