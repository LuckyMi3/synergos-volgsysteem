"use client";

import { supabase } from "../../lib/supabase";

export default function StudentPage() {
  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Student</h1>
      <p>Hier komt straks jouw 1VO volgsysteem (M1/M2/M3 + sliders).</p>
      <button onClick={logout}>Uitloggen</button>
    </div>
  );
}
