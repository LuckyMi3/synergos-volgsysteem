import { PrismaClient } from "@prisma/client";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/* =========================
   Server Action
========================= */

async function setActiveCohort(formData: FormData) {
  "use server";

  const cohortId = String(formData.get("cohortId") || "");
  if (!cohortId) return;

  cookies().set("activeCohortId", cohortId, {
    httpOnly: true,
    path: "/",
  });

  redirect("/admin/cohorts");
}

/* =========================
   Page
========================= */

export default async function AdminCohortsPage() {
  const activeCohortId = cookies().get("activeCohortId")?.value ?? null;

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
        <div style={label}>
          {cohorts.length} totaal
        </div>
        <div style={{ marginLeft: "auto" }}>
          <a href="/admin/teachers" style={{ fontSize: 12 }}>
            naar docentenpool →
          </a>
        </div>
      </div>

      {cohorts.map((c) => {
        const isActive = c.id === activeCohortId;

        return (
          <div
            key={c.id}
            style={{
              ...card,
              borderColor: isActive ? "#2563eb" : "#e5e7eb",
              background: isActive ? "#eff6ff" : "white",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div>
              <strong>{c.title}</strong>
              <div style={label}>
                {c.rubricKey.toUpperCase()} · {c.year}
              </div>
              {isActive && (
                <div style={{ ...label, color: "#2563eb" }}>
                  actief cohort
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <a
                href={`/admin/cohorts/${c.id}`}
                style={{ fontSize: 12 }}
              >
                open →
              </a>

              <form action={setActiveCohort}>
                <input type="hidden" name="cohortId" value={c.id} />
                <button type="submit" style={{ fontSize: 12 }}>
                  {isActive ? "actief" : "maak actief"}
                </button>
              </form>
            </div>
          </div>
        );
      })}
    </div>
  );
}