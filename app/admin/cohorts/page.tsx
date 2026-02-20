import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default async function AdminCohortsPage() {
  const cohorts = await prisma.cohort.findMany({
    orderBy: [{ year: "asc" }, { title: "asc" }],
  });

  const card: React.CSSProperties = {
    border: "1px solid #e5e7eb",
    borderRadius: 10,
    padding: 14,
    background: "white",
  };

  const label: React.CSSProperties = { fontSize: 12, color: "#6b7280" };

  return (
    <div style={{ padding: 18, display: "grid", gap: 12, maxWidth: 900 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
        <h1 style={{ margin: 0, fontSize: 20 }}>Cohorten</h1>
        <div style={label}>{cohorts.length} totaal</div>
        <div style={{ marginLeft: "auto" }}>
          <a href="/admin/teachers" style={{ fontSize: 12 }}>
            naar docentenpool →
          </a>
        </div>
      </div>

      {cohorts.length === 0 ? (
        <div style={card}>
          <div style={label}>Geen cohorten gevonden. Maak er 1 aan in Prisma Studio.</div>
        </div>
      ) : (
        cohorts.map((c) => (
          <a
            key={c.id}
            href={`/admin/cohorts/${c.id}`}
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <div style={{ ...card, display: "flex", justifyContent: "space-between", gap: 12 }}>
              <div>
                <strong>{c.title}</strong>
                <div style={label}>
                  {c.rubricKey.toUpperCase()} · {c.year}
                </div>
              </div>
              <div style={{ ...label, alignSelf: "center" }}>open →</div>
            </div>
          </a>
        ))
      )}
    </div>
  );
}