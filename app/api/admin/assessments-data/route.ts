import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const enrollments = await prisma.enrollment.findMany({
    include: {
      user: true,
      cohort: true,
    },
  });

  const rows = enrollments.map((e) => ({
    id: e.id,
    studentName: [
      e.user.voornaam,
      e.user.tussenvoegsel,
      e.user.achternaam,
    ]
      .filter(Boolean)
      .join(" "),
    userId: e.user.id,
    cohortName: e.cohort.naam,
    cohortId: e.cohort.id,
    uitvoeringId: e.cohort.uitvoeringId,
    assessmentLocked: e.assessmentLocked,
  }));

  return NextResponse.json(rows);
}