import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
  ) {
  const { studentId } = await params;

try {
  const student = await prisma.user.findUnique({
    where: { id: studentId },
    select: { id: true, voornaam: true, tussenvoegsel: true, achternaam: true, email: true, role: true },
  });

  if (!student) {
    return NextResponse.json({ error: "Student niet gevonden" }, { status: 404 });
  }

  const enrollments = await prisma.enrollment.findMany({
    where: { userId: studentId },
    include: { cohort: { include: { uitvoering: true } } },
    orderBy: { createdAt: "asc" },
  });

  const assessments = await prisma.assessment.findMany({
    where: { studentId },
    include: {
      scores: true,
      teacherReviews: {
        include: {
          teacher: { select: { voornaam: true, tussenvoegsel: true, achternaam: true } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const groups = enrollments.map((e) => {
    const rubricKey = (e.cohort.traject || "").toLowerCase().trim();
    const cohortAssessments = assessments.filter(
      (a) => a.rubricKey.toLowerCase().trim() === rubricKey
      );

                                 return {
                                   uitvoeringId: e.cohort.uitvoeringId,
                                   cohortId: e.cohort.id,
                                   cohortNaam: e.cohort.naam,
                                   traject: e.cohort.traject,
                                   enrolledAt: e.createdAt,
                                   assessments: cohortAssessments.map((a) => ({
                                     id: a.id,
                                     moment: a.moment,
                                     scoreCount: a.scores.length,
                                     reviews: a.teacherReviews.map((r) => ({
                                       teacherName: [r.teacher.voornaam, r.teacher.tussenvoegsel, r.teacher.achternaam]
                                       .filter(Boolean)
                                       .join(" "),
                                       status: r.status,
                                       feedback: r.feedback,
                                       publishedAt: r.publishedAt,
                                     })),
                                   })),
                                 };
  });

  const name = [student.voornaam, student.tussenvoegsel, student.achternaam]
  .filter(Boolean)
  .join(" ");

  return NextResponse.json({
    student: { id: student.id, name, email: student.email },
    groups,
  });
} catch (err) {
  console.error("GET /api/students/[studentId]/history failed:", err);
  return NextResponse.json({ error: "Failed to load history" }, { status: 500 });
}
}
