"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [msg, setMsg] = useState("Bezig met inloggen…");

  useEffect(() => {
    (async () => {
      try {
        // Wisselt de ?code=... uit de magic link om voor een echte sessie
        const { error } = await supabase.auth.exchangeCodeForSession(
          window.location.href
        );

        if (error) {
          setMsg("Inloggen mislukt: " + error.message);
          return;
        }

        setMsg("Ingelogd. Doorsturen…");
        router.replace("/");
      } catch (e: any) {
        setMsg("Inloggen mislukt: " + (e?.message ?? String(e)));
      }
    })();
  }, [router]);

  return <div style={{ padding: 40 }}>{msg}</div>;
}
