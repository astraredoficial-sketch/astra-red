"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { loadStore, type Store } from "@/lib/storage";
import type { BirthData, NatalChart, UserProfile } from "@/lib/types";

type SessionSnapshot = {
  ready: boolean;
  store: Store | null;
  me: UserProfile | null;
};

export function useSession() {
  const [revision, setRevision] = useState(0);
  const [snapshot, setSnapshot] = useState<SessionSnapshot>({
    ready: false,
    store: null,
    me: null,
  });

  const refresh = useCallback(() => {
    setRevision((value) => value + 1);
  }, []);

  useEffect(() => {
    let active = true;

    async function loadSession() {
      const local = loadStore();

      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          if (active) {
            setSnapshot({
              ready: true,
              store: { ...local, activeId: null, profiles: [] },
              me: null,
            });
          }
          return;
        }

        const [profileResult, birthResult] = await Promise.all([
          supabase
            .from("profiles")
            .select("id, name, bio, chart, avatar_url, phone_number, whatsapp_opt_in")
            .eq("id", user.id)
            .maybeSingle(),
          supabase
            .from("birth_data")
            .select("birth_date, birth_time, city_id, time_unknown")
            .eq("user_id", user.id)
            .maybeSingle(),
        ]);

        if (!active) return;

        const profile = profileResult.data;
        const birth = birthResult.data;

        if (
          profileResult.error ||
          birthResult.error ||
          !profile ||
          !birth
        ) {
          setSnapshot({
            ready: true,
            store: { ...local, activeId: user.id, profiles: [] },
            me: null,
          });
          return;
        }

        const birthData: BirthData = {
          date: birth.birth_date,
          time: String(birth.birth_time).slice(0, 5),
          cityId: birth.city_id,
          timeUnknown: birth.time_unknown,
        };

        const me: UserProfile = {
          id: profile.id,
          name: profile.name,
          bio: profile.bio,
          avatarUrl: profile.avatar_url,
          phoneNumber: profile.phone_number,
          whatsappOptIn: profile.whatsapp_opt_in,
          birth: birthData,
          chart: profile.chart as NatalChart,
        };

        setSnapshot({
          ready: true,
          me,
          store: {
            ...local,
            activeId: me.id,
            profiles: [me],
          },
        });
      } catch {
        if (active) {
          setSnapshot({
            ready: true,
            store: { ...local, activeId: null, profiles: [] },
            me: null,
          });
        }
      }
    }

    void loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void loadSession();
    });

    const handleStorage = () => {
      void loadSession();
    };

    window.addEventListener("storage", handleStorage);

    return () => {
      active = false;
      subscription.unsubscribe();
      window.removeEventListener("storage", handleStorage);
    };
  }, [revision]);

  return { ...snapshot, refresh };
}

