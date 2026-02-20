import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/* =========================
   Server Actions
========================= */

async function createTeacher(formData: FormData) {
  "use server";

  const name = String(formData.get("name") || "").trim();
  const emailRaw = formData.get("email")?.toString().trim() || "";
  const email = emailRaw.length ? emailRaw : null;

  if (!name) redirect("/admin/teachers?msg=Naam%20ontbreekt");

  // If email is provided: dedupe via upsert on unique email
  if (email) {
    const existing = await prisma.teacher.findUnique({ where: { email } });

    await prisma.teacher.upsert({
      where: { email },
      update: { name }, // keep it lean: email is the key, name can be refreshed
      create: { name, email },
    });

    revalidatePath("/admin/teachers");
    redirect(
      existing
        ? "/admin/teachers?msg=Bestond%20al%3A%20naam%20bijgewerkt"
        : "/admin/teachers?msg=Docent%20toegevoegd"
    );
  }

  // If no email: can't dedupe -> just create
  await prisma.teacher.create({
    data: { name, email: null },
  });

  revalidatePath("/admin/teachers");
  redirect("/admin/teachers?msg=Docent%20toegevoegd%20(zonder%20email)");
}

async function linkTeacherToCohort(formData: FormData) {
  "use server";
  const teacherId = String(formData.get("teacherId") || "");
  const cohortId = String(formData.get("cohortId") || "");
  if (!teacherId || !cohortId) redirect("/admin/teachers?msg=Selecteer%20docent%20en%20cohort");

  await prisma.cohortTeacher.upsert({
    where: { cohortId_teacherId: { cohortId, teacherId } },
    update: {},
    create: { cohortId, teacherId },
  });

  revalidatePath("/admin/teachers");
  redirect("/admin/teachers?msg=Gekoppeld");
}

async function unlinkTeacherFromCohort(formData: FormData) {
  "use server";
  const teacherId = String(formData.get("teacherId") || "");
  const cohortId = String(formData.get("cohortId") || "");
  if (!teacherId || !cohortId) redirect("/admin/teachers?msg=Ontkoppelen%20mislukt");

  await prisma.cohortTeacher.delete({
    where: { cohortId_teacherId: { cohortId, teacherId } },
  });

  revalidatePath("/admin/teachers");
  redirect("/admin/teachers?msg=Ontkoppeld");
}

/* =========================
   UI helpers
========================= */

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        fontSize: 12,
        border: "1px solid #e5e7eb",
        borderRadius: 999,
        padding: "2px 8px",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      {children}
    </span>
  );
}

function ChipUnlinkButton({
  teacherId,
  cohortId,
  title,
}: {
  teacherId: string;
  cohortId: string;
  title: string;
}) {
  return (
    <form action={unlinkTeacherFromCohort} style={{ display: "inline" }}>
      <input type="hidden" name="teacherId" value={teacherId} />
      <input type="hidden" name="cohortId" value={cohortId} />
      <button
        type="submit"
        title={title}
        aria-label={title}
        style={{
          border: "none",
          background: "transparent",
          cursor: "pointer",
          padding: 0,
          lineHeight: 1,
          fontSize: 14,
          color: "#6b7280",
        }}
      >
        ×
      </button>
    </form>
  );
}

/* =========================
   Page
========================= */

export default async function AdminTeachersPage(props: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = (await props.searchParams) ?? {};
  const msgRaw = searchParams.msg;
  const msg = Array.isArray(msgRaw) ? msgRaw[0] : msgRaw;

  const [teachers, cohorts] = await Promise.all([
    prisma.teacher.findMany({
      include: {
        cohorts: { include: { cohort: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.cohort.findMany({
      include: {
        teachers: { include: { teacher: true } },
      },
      orderBy: [{ year: "asc" }, { title: "asc" }],
    }),
  ]);

  const card: React.CSSProperties = {
    border: "1px solid #e5e7eb",
    borderRadius: 10,
    padding: 14,
    background: "white",
  };

  const label: React.CSSProperties = { fontSize: 12, color: "#6b7280" };
  const h1: React.CSSProperties = { margin: 0, fontSize: 20 };
  const h2: React.CSSProperties = { margin: 0, fontSize: 14 };

  return (
    <div style={{ padding: 18, display: "grid", gap: 12, maxWidth: 1100 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
        <h1 style={h1}>Docentenpool</h1>
        <div style={label}>
          {teachers.length} docenten · {cohorts.length} cohorten
        </div>
      </div>

      {msg ? (
        <div
          style={{
            ...card,
            borderColor: "#dbeafe",
            background: "#eff6ff",
            padding: 10,
            fontSize: 13,
          }}
        >
          {decodeURIComponent(msg)}
        </div>
      ) : null}

      {/* Actions */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={card}>
          <h2 style={h2}>Nieuwe docent</h2>
          <div style={{ ...label, marginTop: 6 }}>
            Met email: dedupe (upsert). Zonder email: altijd nieuw record.
          </div>

          <form action={createTeacher} style={{ display: "grid", gap: 8, marginTop: 10 }}>
            <input name="name" placeholder="Naam" required />
            <input name="email" placeholder="Email (sterk aangeraden)" />
            <button type="submit">Toevoegen / bijwerken</button>
          </form>
        </div>

        <div style={card}>
          <h2 style={h2}>Koppel docent ↔ cohort</h2>
          <form action={linkTeacherToCohort} style={{ display: "grid", gap: 8, marginTop: 10 }}>
            <select name="teacherId" required>
              <option value="">Selecteer docent</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                  {t.email ? ` (${t.email})` : ""}
                </option>
              ))}
            </select>

            <select name="cohortId" required>
              <option value="">Selecteer cohort</option>
              {cohorts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>

            <button type="submit">Koppelen</button>
          </form>
        </div>
      </div>

      {/* Two columns */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, alignItems: "start" }}>
        {/* Teachers -> cohorts */}
        <div style={card}>
          <h2 style={h2}>Docenten → cohorten</h2>
          <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
            {teachers.map((t) => (
              <div
                key={t.id}
                style={{ border: "1px solid #f1f5f9", borderRadius: 10, padding: 10 }}
              >
                <div style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
                  <strong>{t.name}</strong>
                  <span style={label}>{t.email ?? "—"}</span>
                </div>

                <div style={{ marginTop: 6 }}>
                  {t.cohorts.length === 0 ? (
                    <span style={{ ...label, color: "#9ca3af" }}>geen cohorten</span>
                  ) : (
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {t.cohorts.map((ct) => (
                        <Chip key={ct.id}>
                          {ct.cohort.title}
                          <ChipUnlinkButton
                            teacherId={t.id}
                            cohortId={ct.cohortId}
                            title={`Ontkoppel ${t.name} van ${ct.cohort.title}`}
                          />
                        </Chip>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cohorts -> teachers */}
        <div style={card}>
          <h2 style={h2}>Cohorten → docenten</h2>
          <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
            {cohorts.map((c) => (
              <div
                key={c.id}
                style={{ border: "1px solid #f1f5f9", borderRadius: 10, padding: 10 }}
              >
                <div style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
                  <strong>{c.title}</strong>
                  <span style={label}>{c.rubricKey.toUpperCase()}</span>
                  <span style={label}>{c.year}</span>
                </div>

                <div style={{ marginTop: 6 }}>
                  {c.teachers.length === 0 ? (
                    <span style={{ ...label, color: "#9ca3af" }}>geen docenten</span>
                  ) : (
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {c.teachers.map((ct) => (
                        <Chip key={ct.id}>
                          {ct.teacher.name}
                          <ChipUnlinkButton
                            teacherId={ct.teacherId}
                            cohortId={c.id}
                            title={`Ontkoppel ${ct.teacher.name} van ${c.title}`}
                          />
                        </Chip>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ ...label, marginTop: 2 }}>
        v1: email dedupe via upsert · unlink = delete op CohortTeacher
      </div>
    </div>
  );
}