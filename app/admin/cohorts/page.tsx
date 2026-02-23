// app/admin/cohorts/page.tsx
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic"; // handig tijdens admin dev (geen caching gezeik)

export default async function AdminCohortsPage() {
  const cohorts = await prisma.cohort.findMany({
    orderBy: [{ createdAt: "desc" }, { naam: "asc" }],
    include: {
      enrollments: true, // alleen count/info nodig; geen user payload op dit overzicht
    },
  });

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Cohorts</h1>
        <span style={{ opacity: 0.7 }}>({cohorts.length})</span>
      </div>

      <p style={{ marginTop: 8, marginBottom: 16, opacity: 0.8 }}>
        Overzicht van uitvoeringen. Klik door voor detail.
      </p>

      <div
        style={{
          border: "1px solid rgba(0,0,0,0.12)",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "rgba(0,0,0,0.04)", textAlign: "left" }}>
              <th style={{ padding: 12 }}>Naam</th>
              <th style={{ padding: 12 }}>Uitvoering</th>
              <th style={{ padding: 12 }}>Traject</th>
              <th style={{ padding: 12 }}>Students</th>
              <th style={{ padding: 12 }}>Aangemaakt</th>
            </tr>
          </thead>
          <tbody>
            {cohorts.map((c) => (
              <tr
                key={c.id}
                style={{ borderTop: "1px solid rgba(0,0,0,0.08)" }}
              >
                <td style={{ padding: 12, fontWeight: 600 }}>
                  <Link href={`/admin/cohorts/${c.id}`} style={{ textDecoration: "none" }}>
                    {c.naam}
                  </Link>
                </td>
                <td style={{ padding: 12, opacity: 0.85 }}>{c.uitvoeringId}</td>
                <td style={{ padding: 12, opacity: 0.85 }}>{c.traject}</td>
                <td style={{ padding: 12 }}>{c.enrollments.length}</td>
                <td style={{ padding: 12, opacity: 0.75 }}>
                  {new Date(c.createdAt).toLocaleString("nl-NL")}
                </td>
              </tr>
            ))}
            {cohorts.length === 0 && (
              <tr>
                <td style={{ padding: 12, opacity: 0.7 }} colSpan={5}>
                  Geen cohorts gevonden.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 16, opacity: 0.7, fontSize: 12 }}>
        Tip: als je hierna de enrollments + users wil tonen, doen we dat op de detailpagina
        <code style={{ marginLeft: 6 }}>/admin/cohorts/[id]</code>.
      </div>
    </div>
  );
}