import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: { cohortId: string } }
) {
  const { cohortId } = params;
  const body = await req.json();
  const { teacherIds } = body ?? {};

  if (!Array.isArray(teacherIds) || teacherIds.length === 0) {
    return NextResponse.json(
      { error: "teacherIds (array) is required" },
      { status: 400 }
    );
  }

  await prisma.cohortTeacher.createMany({
    data: teacherIds.map((teacherId: string) => ({
      cohortId,
      teacherId,
    })),
    skipDuplicates: true,
  });

  const teachers = await prisma.cohortTeacher.findMany({
    where: { cohortId },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(teachers);
}
