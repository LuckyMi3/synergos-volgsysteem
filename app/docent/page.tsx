"use client";

import { supabase } from "../../lib/supabase";

export default function DocentPage() {
  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Docent</h1>
      <p>Hier komt straks jouw docent-dashboard (studenten + feedbacklaag).</p>
      <button onClick={logout}>Uitloggen</button>
    </div>
  );
}
