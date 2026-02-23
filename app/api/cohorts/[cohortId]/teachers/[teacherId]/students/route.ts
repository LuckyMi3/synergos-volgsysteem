import { NextResponse } from "next/server";
import { PrismaClient, Role } from "@prisma/client";

export const runtime = "nodejs";
const prisma = new PrismaClient();

export async function GET(
  _req: Request,
  { params }: { params: { cohortId: string; teacherId: string } }
) {
  try {
    const { cohortId, teacherId } = params;

    if (!cohortId) {
      return NextResponse.json({ ok: false, error: "Missing cohortId" }, { status: 400 });
    }
    if (!teacherId) {
      return NextResponse.json({ ok: false, error: "Missing teacherId" }, { status: 400 });
    }

    // 1) Teacher must exist and be teacher/admin
    const teacher = await prisma.user.findUnique({
      where: { id: teacherId },
      select: { id: true, role: true, voornaam: true, achternaam: true },
    });

    if (!teacher) {
      return NextResponse.json({ ok: false, error: "Teacher not found" }, { status: 404 });
    }
    if (teacher.role !== Role.TEACHER && teacher.role !== Role.ADMIN) {
      return NextResponse.json({ ok: false, error: "Not allowed" }, { status: 403 });
    }

    // 2) Optional access check: teacher must be enrolled in this cohort (or admin)
    if (teacher.role !== Role.ADMIN) {
      const teacherEnrollment = await prisma.enrollment.findUnique({
        where: { userId_cohortId: { userId: teacherId, cohortId } },
        select: { id: true },
      });

      if (!teacherEnrollment) {
        return NextResponse.json({ ok: false, error: "Teacher not enrolled in cohort" }, { status: 403 });
      }
    }

    // 3) Get cohort students
    const enrollments = await prisma.enrollment.findMany({
      where: {
        cohortId,
        user: { role: Role.STUDENT },
      },
      include: {
        user: {
          select: {
            id: true,
            crmCustomerId: true,
            voornaam: true,
            tussenvoegsel: true,
            achternaam: true,
            email: true,
            mobiel: true,
            role: true,
            createdAt: true,
          },
        },
      },
      orderBy: [{ createdAt: "asc" }],
    });

    const students = enrollments.map((e) => e.user);

    return NextResponse.json({
      ok: true,
      cohortId,
      teacherId,
      students,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}