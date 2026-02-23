import { PrismaClient } from "@prisma/client";
import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import React from "react";
import { revalidatePath } from "next/cache";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/* =========================
   Server Actions
========================= */

async function setActiveCohort(formData: FormData) {
  "use server";

  const cohortId = String(formData.get("cohortId") || "");
  if (!cohortId) return;

  cookies().set("activeCohortId", cohortId, {
    httpOnly: true,
    path: "/",
  });

  redirect(`/admin/cohorts/${cohortId}`);
}

async function unlinkTeacher(formData: FormData) {
  "use server";

  const cohortId = String(formData.get("cohortId") || "");
  const userId = String(formData.get("userId") || "");
  if (!cohortId || !userId) return;

  await prisma.enrollment.delete({
    where: {
      userId_cohortId: { userId, cohortId },
    },
  });

  revalidatePath(`/admin/cohorts/${cohortId}`);
}

/* =========================
   Page
========================= */

export default async function AdminCohortDetailPage({
  params,
}: {
  params: { Id: string };
}) {
  const activeCohortId = cookies().get("activeCohortId")?.value ?? null;

  const cohort = await prisma.cohort.findUnique({
    where: { id: params.Id },
    include: {
      enrollments: {
        include: { user: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!cohort) return notFound();

  const isActive = cohort.id === activeCohortId;

  const teacherEnrollments = cohort.enrollments.filter(
    (e) => e.user.role === "TEACHER"
  );
  const studentEnrollments = cohort.enrollments.filter(
    (e) => e.user.role === "STUDENT"
  );
  const adminEnrollments = cohort.enrollments.filter(
    (e) => e.user.role === "ADMIN"
  );

  const card: React.CSSProperties = {
    border: "1px solid #e5e7eb",
    borderRadius: 10,
    padding: 14,
    background: "white",
  };

  const label: React.CSSProperties = { fontSize: 12, color: "#6b7280" };

  function fullName(u: any) {
    return [u.voornaam, u.tussenvoegsel, u.achternaam].filter(Boolean).join(" ");
  }

  return (
    <div style={{ padding: 18, display: "grid", gap: 12, maxWidth: 1000 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
        <h1 style={{ margin: 0, fontSize: 20 }}>Cohort</h1>
        <div style={label}>{cohort.enrollments.length} inschrijvingen</div>

        <div style={{ marginLeft: "auto", display: "flex", gap: 12 }}>
          <a href="/admin/cohorts" style={{ fontSize: 12 }}>
            ← terug naar cohorten
          </a>
          <a href="/admin/teachers" style={{ fontSize: 12 }}>
            naar docentenpool →
          </a>
        </div>
      </div>

      <div
        style={{
          ...card,
          borderColor: isActive ? "#2563eb" : "#e5e7eb",
          background: isActive ? "#eff6ff" : "white",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 12,
        }}
      >
        <div style={{ display: "grid", gap: 8, flex: 1 }}>
          <div>
            <strong style={{ fontSize: 16 }}>{cohort.naam}</strong>
          </div>

          <div style={label}>
            traject: <strong>{cohort.traject}</strong> · uitvoering:{" "}
            <strong>{cohort.uitvoeringId}</strong>
          </div>

          <div style={label}>
            aangemaakt:{" "}
            <strong>{new Date(cohort.createdAt).toLocaleString("nl-NL")}</strong>
          </div>

          {/* Docenten (optie A) */}
          <div style={{ display: "grid", gap: 6, marginTop: 6 }}>
            <div style={{ ...label, fontSize: 12 }}>
              docenten ({teacherEnrollments.length})
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {teacherEnrollments.length === 0 ? (
                <div style={label}>Nog geen docenten gekoppeld.</div>
              ) : (
                teacherEnrollments.map((e) => {
                  const u = e.user;
                  return (
                    <span
                      key={e.id}
                      title={u.email}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        border: "1px solid #e5e7eb",
                        borderRadius: 999,
                        padding: "6px 10px",
                        fontSize: 12,
                        background: "white",
                      }}
                    >
                      {fullName(u) || u.email || u.id}

                      <form action={unlinkTeacher} style={{ margin: 0 }}>
                        <input type="hidden" name="cohortId" value={cohort.id} />
                        <input type="hidden" name="userId" value={e.userId} />
                        <button
                          type="submit"
                          aria-label="Docent ontkoppelen"
                          title="Ontkoppelen"
                          style={{
                            border: "none",
                            background: "transparent",
                            cursor: "pointer",
                            color: "#6b7280",
                            fontSize: 16,
                            lineHeight: "12px",
                            padding: "0 2px",
                          }}
                        >
                          ×
                        </button>
                      </form>
                    </span>
                  );
                })
              )}

              {/* + Docent */}
              <a
                href={`/admin/teachers?cohortId=${encodeURIComponent(cohort.id)}`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  border: "1px solid #e5e7eb",
                  borderRadius: 999,
                  padding: "6px 10px",
                  fontSize: 12,
                  textDecoration: "none",
                  background: "white",
                }}
                title="Docent koppelen"
              >
                + docent
              </a>
            </div>

            {/* Optioneel: admins gekoppeld (zodat ze niet ‘verdwijnen’) */}
            {adminEnrollments.length > 0 && (
              <div style={label}>
                admins gekoppeld:{" "}
                <strong>
                  {adminEnrollments
                    .map((e) => fullName(e.user) || e.user.email || e.user.id)
                    .join(", ")}
                </strong>
              </div>
            )}

            {isActive && (
              <div style={{ ...label, color: "#2563eb" }}>actief cohort</div>
            )}
          </div>
        </div>

        <form action={setActiveCohort}>
          <input type="hidden" name="cohortId" value={cohort.id} />
          <button type="submit" style={{ fontSize: 12 }}>
            {isActive ? "actief" : "maak actief"}
          </button>
        </form>
      </div>

      <div style={card}>
        <h2 style={{ margin: 0, fontSize: 16 }}>
          Studenten ({studentEnrollments.length})
        </h2>
        <div style={{ height: 10 }} />

        {studentEnrollments.length === 0 ? (
          <div style={label}>Nog geen studenten gekoppeld aan dit cohort.</div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {studentEnrollments.map((e) => {
              const u = e.user;

              return (
                <div
                  key={e.id}
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: 10,
                    padding: 12,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <div style={{ display: "grid", gap: 2 }}>
                    <div>
                      <strong>{fullName(u) || u.email || u.id}</strong>
                    </div>

                    <div style={label}>
                      status: {e.trajectStatus ?? "—"}
                      {e.coachNaam ? ` · coach: ${e.coachNaam}` : ""}
                    </div>

                    <div style={label}>
                      crmCustomerId: {u.crmCustomerId ?? "—"} · userId: {u.id}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 10 }}>
                    <a href={`/admin/users/${u.id}`} style={{ fontSize: 12 }}>
                      open gebruiker →
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}