import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: { teacherId: string } }
) {
  const { teacherId } = params;

  const memberships = await prisma.cohortTeacher.findMany({
    where: { teacherId },
    include: { cohort: true },
    orderBy: [{ cohort: { year: "desc" } }, { cohort: { rubricKey: "asc" } }],
  });

  return NextResponse.json(memberships.map((m) => m.cohort));
}
