import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/auth/requireStaff";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ teacherId: string }> }
) {
  const { teacherId } = await params;
  const { searchParams } = new URL(req.url);
  const cohortId = searchParams.get("cohortId");

  if (!cohortId) {
    return NextResponse.json({ error: "cohortId is verplicht" }, { status: 400 });
  }

  const auth = await requireStaff();
  if (auth.ok === false) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  if (auth.role !== "ADMIN" && auth.userId !== teacherId) {
    return NextResponse.json({ error: "Geen toegang" }, { status: 403 });
  }

  try {
    const teacherEnrollment = await prisma.enrollment.findFirst({
      where: { userId: teacherId, cohortId },
      select: { id: true },
    });

    if (!teacherEnrollment) {
      return NextResponse.json({ error: "Geen toegang tot dit cohort" }, { status: 403 });
    }

    const cohort = await prisma.cohort.findUnique({
      where: { id: cohortId },
      select: { id: true, naam: true, traject: true },
    });

    if (!cohort) {
      return NextResponse.json({ error: "Cohort niet gevonden" }, { status: 404 });
    }

    const rubricKey = (cohort.traject || "1vo").toLowerCase().trim();

    const enrollments = await prisma.enrollment.findMany({
      where: { cohortId, user: { role: "STUDENT" } },
      select: {
        user: {
          select: {
            id: true,
            voornaam: true,
            tussenvoegsel: true,
            achternaam: true,
            email: true,
          },
        },
      },
    });

    const studentIds = enrollments.map((e) => e.user.id);

    const assessments = studentIds.length
      ? await prisma.assessment.findMany({
          where: { studentId: { in: studentIds }, rubricKey },
          select: {
            studentId: true,
            moment: true,
            scores: { select: { id: true } },
            teacherReviews: { select: { status: true } },
          },
        })
      : [];

    type StatusValue = "GEEN" | "LEEG" | "INGEVULD" | "CONCEPT" | "GEPUBLICEERD";

    const byStudent: Record<string, Partial<Record<string, StatusValue>>> = {};

    for (const a of assessments) {
      if (!byStudent[a.studentId]) byStudent[a.studentId] = {};

      const hasScores = a.scores.length > 0;
      const published = a.teacherReviews.some((r) => r.status === "PUBLISHED");
      const draft = a.teacherReviews.some((r) => r.status === "DRAFT");

      let value: StatusValue;
      if (!hasScores) value = "LEEG";
      else if (published) value = "GEPUBLICEERD";
      else if (draft) value = "CONCEPT";
      else value = "INGEVULD";

      byStudent[a.studentId][a.moment] = value;
    }

    const students = enrollments.map((e) => {
      const u = e.user;
      const name = [u.voornaam, u.tussenvoegsel, u.achternaam].filter(Boolean).join(" ");
      const stat = byStudent[u.id] || {};

      return {
        id: u.id,
        name: name || u.email || u.id,
        email: u.email,
        moments: {
          M1: stat.M1 ?? "GEEN",
          M2: stat.M2 ?? "GEEN",
          M3: stat.M3 ?? "GEEN",
        },
      };
    });

    students.sort((a, b) => a.name.localeCompare(b.name, "nl"));

    return NextResponse.json({ cohort, students });
  } catch (err) {
    console.error("GET /api/teachers/[teacherId]/students-overview failed:", err);
    return NextResponse.json({ error: "Failed to load overview" }, { status: 500 });
  }
}
