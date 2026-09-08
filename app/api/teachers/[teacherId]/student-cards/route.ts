import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRubric } from "@/lib/rubrics";

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

try {
  const teacherEnrollment = await prisma.enrollment.findFirst({
    where: { userId: teacherId, cohortId },
  });
  if (!teacherEnrollment) {
    return NextResponse.json({ error: "Geen toegang tot dit cohort" }, { status: 403 });
  }

  const cohort = await prisma.cohort.findUnique({ where: { id: cohortId } });
  if (!cohort) {
    return NextResponse.json({ error: "Cohort niet gevonden" }, { status: 404 });
  }

  const rubricKey = (cohort.traject || "1vo").toLowerCase().trim();
  const rubric: any = getRubric(rubricKey);
  const totalQuestions = rubric
  ? rubric.themes.reduce((sum: number, t: any) => sum + t.questions.length, 0)
    : 0;

  const enrollments = await prisma.enrollment.findMany({
    where: { cohortId },
    include: {
      user: {
        select: { id: true, voornaam: true, tussenvoegsel: true, achternaam: true, role: true },
      },
    },
  });

  const students = enrollments.map((e) => e.user).filter((u) => u.role === "STUDENT");

  const cards = [];

  for (const student of students) {
    const assessments = await prisma.assessment.findMany({
      where: { studentId: student.id, rubricKey },
      include: {
        scores: true,
        teacherReviews: true,
      },
    });

  const moments: Record<string, any> = {};
    for (const moment of ["M1", "M2", "M3"]) {
      const a = assessments.find((x) => x.moment === (moment as any));
      if (!a) {
        moments[moment] = { filled: 0, total: totalQuestions, reviewStatus: "GEEN" };
        continue;
      }
      const published = a.teacherReviews.some((r) => r.status === "PUBLISHED");
      const draft = a.teacherReviews.some((r) => r.status === "DRAFT");
      moments[moment] = {
        filled: a.scores.length,
        total: totalQuestions,
        reviewStatus: published ? "PUBLISHED" : draft ? "DRAFT" : "GEEN",
        assessmentId: a.id,
      };
    }

  const name = [student.voornaam, student.tussenvoegsel, student.achternaam]
    .filter(Boolean)
    .join(" ");

  cards.push({ id: student.id, name, moments });
  }

  cards.sort((a, b) => a.name.localeCompare(b.name));

  return NextResponse.json({
    cohort: { id: cohort.id, naam: cohort.naam, traject: cohort.traject },
    students: cards,
  });
} catch (err) {
  console.error("GET /api/teachers/[teacherId]/student-cards failed:", err);
  return NextResponse.json({ error: "Failed to load student cards" }, { status: 500 });
}
}
