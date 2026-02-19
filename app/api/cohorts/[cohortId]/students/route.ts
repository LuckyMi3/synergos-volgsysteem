import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: { cohortId: string } }
) {
  const { cohortId } = params;
  const body = await req.json();
  const { studentIds } = body ?? {};

  if (!Array.isArray(studentIds) || studentIds.length === 0) {
    return NextResponse.json(
      { error: "studentIds (array) is required" },
      { status: 400 }
    );
  }

  await prisma.cohortStudent.createMany({
    data: studentIds.map((studentId: string) => ({
      cohortId,
      studentId,
    })),
    skipDuplicates: true,
  });

  const members = await prisma.cohortStudent.findMany({
    where: { cohortId },
    include: { student: true },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(members);
}
