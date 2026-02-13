"use client";

import { supabase } from "../../lib/supabase";

export default function AdminPage() {
  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Admin</h1>
      <p>Hier komt straks beheer: cohorts, rollen, rubric versies (1VO/2VO/3VO).</p>
      <button onClick={logout}>Uitloggen</button>
    </div>
  );
}
