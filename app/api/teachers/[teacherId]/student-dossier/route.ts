import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ teacherId: string }> }
) {
  const { teacherId } = await params;
  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get("studentId");

  if (!studentId) {
    return NextResponse.json({ error: "studentId is verplicht" }, { status: 400 });
  }

  try {
    const studentEnrollments = await prisma.enrollment.findMany({
      where: { userId: studentId },
      select: { cohortId: true },
    });

    const studentCohortIds = studentEnrollments.map((e) => e.cohortId);

    if (studentCohortIds.length === 0) {
      return NextResponse.json(
        { error: "Student niet gevonden of geen cohorts" },
        { status: 404 }
      );
    }

    const sharedEnrollment = await prisma.enrollment.findFirst({
      where: { userId: teacherId, cohortId: { in: studentCohortIds } },
      select: { id: true },
    });

    if (!sharedEnrollment) {
      return NextResponse.json({ error: "Geen toegang tot deze student" }, { status: 403 });
    }

    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        voornaam: true,
        tussenvoegsel: true,
        achternaam: true,
        email: true,
        crmCustomerId: true,
        enrollments: {
          select: {
            cohort: {
              select: { id: true, naam: true, traject: true, uitvoeringId: true },
            },
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student niet gevonden" }, { status: 404 });
    }

    const credential = await prisma.studentCredential.upsert({
      where: { userId: studentId },
      update: {},
      create: { userId: studentId },
    });

    return NextResponse.json({ student, credential });
  } catch (err) {
    console.error("GET /api/teachers/[teacherId]/student-dossier failed:", err);
    return NextResponse.json({ error: "Failed to load dossier" }, { status: 500 });
  }
}
