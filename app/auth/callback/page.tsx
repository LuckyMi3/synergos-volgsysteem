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
        const url = window.location.href;

        // 1) Als er een ?code=... is (PKCE), dan exchange
        const hasCode = new URL(url).searchParams.get("code");
        if (hasCode) {
          const { error } = await supabase.auth.exchangeCodeForSession(url);
          if (error) {
            setMsg("Inloggen mislukt: " + error.message);
            return;
          }
        } else {
          // 2) Anders: implicit flow (tokens in #hash)
          const { data, error } = await supabase.auth.getSessionFromUrl({
            storeSession: true,
          });

          if (error) {
            setMsg("Inloggen mislukt: " + error.message);
            return;
          }

          if (!data.session) {
            setMsg(
              "Inloggen mislukt: geen sessie gevonden in de callback URL (hash leeg)."
            );
            return;
          }
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
