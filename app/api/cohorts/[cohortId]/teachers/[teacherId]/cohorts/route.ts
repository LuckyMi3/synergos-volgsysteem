import { NextResponse } from "next/server";
import { PrismaClient, Role } from "@prisma/client";

export const runtime = "nodejs";
const prisma = new PrismaClient();

export async function GET(
  _req: Request,
  { params }: { params: { teacherId: string } }
) {
  try {
    const { teacherId } = params;

    if (!teacherId) {
      return NextResponse.json({ ok: false, error: "Missing teacherId" }, { status: 400 });
    }

    // Optional: ensure user exists + is teacher/admin
    const teacher = await prisma.user.findUnique({
      where: { id: teacherId },
      select: { id: true, role: true },
    });

    if (!teacher) {
      return NextResponse.json({ ok: false, error: "Teacher not found" }, { status: 404 });
    }
    if (teacher.role !== Role.TEACHER && teacher.role !== Role.ADMIN) {
      return NextResponse.json({ ok: false, error: "Not allowed" }, { status: 403 });
    }

    // Teacher "memberships" are enrollments
    const memberships = await prisma.enrollment.findMany({
      where: { userId: teacherId },
      include: { cohort: true },
      orderBy: [{ cohort: { createdAt: "desc" } }, { cohort: { naam: "asc" } }],
    });

    const cohorts = memberships.map((m) => m.cohort);

    return NextResponse.json({ ok: true, teacherId, cohorts });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}