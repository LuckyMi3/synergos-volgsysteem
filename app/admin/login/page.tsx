"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onLogin() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) throw new Error(data?.error || "Login failed");

      router.push("/admin");
      router.refresh();
    } catch (e: any) {
      setError(e?.message ?? "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 24, maxWidth: 520 }}>
      <h1 style={{ fontSize: 26, fontWeight: 900, marginBottom: 10 }}>Admin login</h1>
      <p style={{ opacity: 0.8, lineHeight: 1.4 }}>
        Alleen voor Nick. Dit staat los van Apollo en is bedoeld als noodtoegang en beheer.
      </p>

      <div style={{ marginTop: 16 }}>
        <div style={{ fontWeight: 800, marginBottom: 6 }}>Wachtwoord</div>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: "100%", padding: 12, borderRadius: 12, border: "1px solid rgba(0,0,0,0.2)" }}
          placeholder="ADMIN_PASSWORD"
        />
      </div>

      <button
        onClick={onLogin}
        disabled={loading || !password}
        style={{
          marginTop: 14,
          padding: "10px 14px",
          borderRadius: 12,
          border: "1px solid rgba(0,0,0,0.15)",
          background: loading || !password ? "rgba(0,0,0,0.25)" : "black",
          color: "white",
          fontWeight: 900,
          cursor: loading || !password ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "Inloggen..." : "Inloggen"}
      </button>

      {error && (
        <div style={{ marginTop: 14, color: "crimson" }}>
          <b>Fout:</b> {error}
        </div>
      )}
    </div>
  );
}