"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

type Role = "student" | "teacher" | "admin";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function routeByRole() {
    setError(null);

    const { data: userRes, error: userErr } = await supabase.auth.getUser();
    if (userErr) {
      setError(userErr.message);
      setLoading(false);
      return;
    }

    const user = userRes.user;
    if (!user) {
      setUserEmail(null);
      setLoading(false);
      return;
    }

    setUserEmail(user.email ?? null);

    const { data: profile, error: profErr } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (profErr) {
      setError(
        "Je profiel/rol ontbreekt in Supabase (profiles). Voeg een profile toe of zet de auto-profile trigger aan."
      );
      setLoading(false);
      return;
    }

    const role = profile.role as Role;

    if (role === "admin") router.replace("/admin");
    else if (role === "teacher") router.replace("/docent");
    else router.replace("/student");
  }

  useEffect(() => {
    routeByRole();

    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      routeByRole();
    });

    return () => sub.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function login() {
    const email = prompt("E-mailadres:");
    if (!email) return;

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        // ✅ DIT is de juiste plek + het juiste pad
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) alert(error.message);
    else alert("Check je mail voor de loginlink.");
  }

  if (loading) return <div style={{ padding: 40 }}>Laden…</div>;

  return (
    <div style={{ padding: 40 }}>
      <h1>Synergos Volgsysteem</h1>

      {userEmail ? (
        <p>
          Ingelogd als <b>{userEmail}</b> — rol bepalen…
        </p>
      ) : (
        <>
          <p>Je bent niet ingelogd.</p>
          <button onClick={login}>Inloggen via e-mail</button>
        </>
      )}

      {error && <div style={{ marginTop: 16, color: "#b91c1c" }}>{error}</div>}
    </div>
  );
}
