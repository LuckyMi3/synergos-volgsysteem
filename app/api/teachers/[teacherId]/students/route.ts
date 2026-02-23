import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: { teacherId: string } }) {
  const { teacherId } = params;
  const { searchParams } = new URL(req.url);
  const cohortId = searchParams.get("cohortId");

  if (!cohortId) {
    return NextResponse.json({ error: "cohortId is required" }, { status: 400 });
  }

  // v1: teacher (of admin) moet aan cohort hangen via Enrollment
  const allowed = await prisma.enrollment.findFirst({
    where: {
      cohortId,
      userId: teacherId,
      user: { role: { in: ["TEACHER", "ADMIN"] } },
    },
    select: { id: true },
  });

  if (!allowed) {
    return NextResponse.json({ error: "Not allowed for this cohort" }, { status: 403 });
  }

  // studenten = enrollments binnen cohort met role STUDENT
  const enrollments = await prisma.enrollment.findMany({
    where: {
      cohortId,
      user: { role: "STUDENT" },
    },
    include: { user: true },
    orderBy: { createdAt: "asc" },
  });

  // Minimal payload (en je docent-page kan zowel name als voornaam/achternaam aan)
  const students = enrollments.map((e) => ({
    id: e.user.id,
    voornaam: e.user.voornaam,
    tussenvoegsel: e.user.tussenvoegsel,
    achternaam: e.user.achternaam,
    email: e.user.email,
    crmCustomerId: e.user.crmCustomerId,
  }));

  return NextResponse.json(students);
}