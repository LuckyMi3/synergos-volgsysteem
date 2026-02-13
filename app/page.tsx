"use client";

import { supabase } from "../lib/supabase";
import { useEffect, useState } from "react";

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  async function login() {
    const email = prompt("E-mailadres:");
    if (!email) return;

    await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });

    alert("Check je mail voor de loginlink.");
  }

  async function logout() {
    await supabase.auth.signOut();
  }

  if (loading) return <div style={{ padding: 40 }}>Laden…</div>;

  return (
    <div style={{ padding: 40 }}>
      <h1>Synergos Volgsysteem</h1>

      {!user ? (
        <>
          <p>Je bent niet ingelogd.</p>
          <button onClick={login}>Inloggen via e-mail</button>
        </>
      ) : (
        <>
          <p>
            Ingelogd als <b>{user.email}</b>
          </p>
          <button onClick={logout}>Uitloggen</button>

          <hr style={{ margin: "24px 0" }} />

          <p>
            ✅ Login werkt  
            <br />
            ⏭ Volgende stap: student- en docentdashboard
          </p>
        </>
      )}
    </div>
  );
}
