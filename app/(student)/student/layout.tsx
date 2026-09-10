import type { ReactNode } from "react";
import Link from "next/link";
import { requireUser } from "@/lib/auth/requireUser";

export default async function StudentLayout({ children }: { children: ReactNode }) {
  const auth = await requireUser();

  if (auth.ok === false || auth.role === "TEACHER") {
    return (
      <main style={{ padding: 24, maxWidth: 720, margin: "0 auto" }}>
        <h1 style={{ marginTop: 0 }}>Geen toegang</h1>
        <p style={{ color: "#666" }}>Deze omgeving is alleen voor cursisten.</p>
        <Link href="/login" style={{ fontWeight: 900, textDecoration: "none" }}>
          ← Naar login
        </Link>
      </main>
    );
  }

  return <>{children}</>;
}

