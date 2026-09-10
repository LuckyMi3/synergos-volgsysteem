import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/requireUser";

const ALLOWED_MOMENTS = new Set(["M1", "M2", "M3"]);

export async function POST(req: Request) {
  const auth = await requireUser();
  if (auth.ok === false) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();

    const studentId = typeof body?.studentId === "string" ? body.studentId.trim() : "";
    const rubricKey = typeof body?.rubricKey === "string" ? body.rubricKey.trim() : "";
    const momentRaw = typeof body?.moment === "string" ? body.moment.trim() : "";

    if (!studentId) return NextResponse.json({ error: "studentId is required" }, { status: 400 });
    if (!rubricKey) return NextResponse.json({ error: "rubricKey is required" }, { status: 400 });
    if (!momentRaw) return NextResponse.json({ error: "moment is required" }, { status: 400 });
    if (!ALLOWED_MOMENTS.has(momentRaw)) {
      return NextResponse.json(
        { error: "moment must be one of M1, M2, M3" },
        { status: 400 }
      );
    }

    if (auth.role === "STUDENT" && auth.userId !== studentId) {
      return NextResponse.json({ error: "Geen toegang" }, { status: 403 });
    }

    const moment = momentRaw as "M1" | "M2" | "M3";

    const assessment = await prisma.assessment.upsert({
      where: {
        // ✅ matcht schema: @@unique([studentId, rubricKey, moment], name: "student_rubric_moment")
        student_rubric_moment: { studentId, rubricKey, moment },
      },
      update: {},
      create: {
        studentId,
        rubricKey,
        moment,
      },
    });

    return NextResponse.json(assessment);
  } catch (error) {
    console.error("Ensure assessment error:", error);
    return NextResponse.json({ error: "Failed to ensure assessment" }, { status: 500 });
  }
}
