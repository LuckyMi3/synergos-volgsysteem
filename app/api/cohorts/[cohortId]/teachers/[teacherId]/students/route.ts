import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: { teacherId: string } }
) {
  const { teacherId } = params;
  const { searchParams } = new URL(req.url);
  const cohortId = searchParams.get("cohortId");

  if (!cohortId) {
    return NextResponse.json({ error: "cohortId is required" }, { status: 400 });
  }

  // security v1 (zonder auth): check dat teacher aan cohort hangt
  const allowed = await prisma.cohortTeacher.findUnique({
    where: { cohortId_teacherId: { cohortId, teacherId } },
  });

  if (!allowed) {
    return NextResponse.json({ error: "Not allowed for this cohort" }, { status: 403 });
  }

  const members = await prisma.cohortStudent.findMany({
    where: { cohortId },
    include: { student: true },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(members.map((m) => m.student));
}
