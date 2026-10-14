"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export function HomeSessionRedirect() {
  const router = useRouter();

  useEffect(() => {
    let active = true;
    let authRevision = 0;
    let currentUserId: string | null = null;

    async function routeForUser(userId: string | null) {
      currentUserId = userId;
      if (!userId) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("chart")
        .eq("id", userId)
        .maybeSingle();

      if (!active || currentUserId !== userId) return;
      if (error) {
        console.error("No se pudo comprobar la carta del usuario:", error);
        return;
      }

      router.replace(data?.chart ? "/carta" : "/onboarding");
    }

    const initialRevision = authRevision;
    void supabase.auth.getUser().then(({ data, error }) => {
      if (!active || authRevision !== initialRevision) return;
      if (error) {
        console.error("No se pudo comprobar la sesión:", error);
        return;
      }
      void routeForUser(data.user?.id ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      window.setTimeout(() => {
        if (!active) return;
        authRevision += 1;
        void routeForUser(session?.user.id ?? null);
      }, 0);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [router]);

  return null;
}
