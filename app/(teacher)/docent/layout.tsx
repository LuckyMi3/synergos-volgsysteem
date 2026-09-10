import type { ReactNode } from "react";
import Link from "next/link";
import { requireStaff } from "@/lib/auth/requireStaff";

export default async function TeacherLayout({ children }: { children: ReactNode }) {
  const auth = await requireStaff();

  if (auth.ok === false) {
    return (
      <main style={{ padding: 24, maxWidth: 720, margin: "0 auto" }}>
        <h1 style={{ marginTop: 0 }}>Geen toegang</h1>
        <p style={{ color: "#666" }}>
          Je hebt geen docent- of adminrechten om deze pagina te bekijken.
        </p>
        <Link href="/login" style={{ fontWeight: 900, textDecoration: "none" }}>
          ← Naar login
        </Link>
      </main>
    );
  }

  return <>{children}</>;
}

