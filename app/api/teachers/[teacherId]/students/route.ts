import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/auth/requireStaff";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ teacherId: string }> }
) {
  const { teacherId } = await params;

  const auth = await requireStaff();
  if (auth.ok === false) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  if (auth.role !== "ADMIN" && auth.userId !== teacherId) {
    return NextResponse.json({ error: "Geen toegang" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const cohortId = searchParams.get("cohortId");

  if (!cohortId) {
    return NextResponse.json({ error: "cohortId is required" }, { status: 400 });
  }

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

  const enrollments = await prisma.enrollment.findMany({
    where: {
      cohortId,
      user: { role: "STUDENT" },
    },
    include: { user: true },
    orderBy: { createdAt: "asc" },
  });

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
