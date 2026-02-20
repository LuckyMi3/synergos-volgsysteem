import type { ReactNode } from "react";
import AdminNav from "./AdminNav";

export default function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ display: "flex", gap: 10, alignItems: "baseline", marginBottom: 14 }}>
        <h1 style={{ fontSize: 24, margin: 0 }}>Admin</h1>
        <div style={{ fontSize: 12, color: "#666" }}>v1 - navigatie</div>
      </div>

      <AdminNav />

      <div
        style={{
          border: "1px solid #eee",
          borderRadius: 12,
          padding: 16,
          background: "#fff",
        }}
      >
        {children}
      </div>
    </div>
  );
}