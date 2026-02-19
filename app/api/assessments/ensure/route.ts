import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const studentId = typeof body?.studentId === "string" ? body.studentId.trim() : "";
    const moment = typeof body?.moment === "string" ? body.moment.trim() : "";
    const rubricKey = typeof body?.rubricKey === "string" ? body.rubricKey.trim() : "";

    if (!studentId) return NextResponse.json({ error: "studentId is required" }, { status: 400 });
    if (!moment) return NextResponse.json({ error: "moment is required" }, { status: 400 });
    if (!rubricKey) return NextResponse.json({ error: "rubricKey is required" }, { status: 400 });

    // Let op: jouw unique is (studentId, moment, rubricKey)
    const assessment = await prisma.assessment.upsert({
      where: {
        studentId_moment_rubricKey: { studentId, moment, rubricKey },
      },
      update: {},
      create: {
        studentId,
        moment,
        rubricKey,
        // status heeft default "draft", createdAt default now()
      },
    });

    return NextResponse.json(assessment);
  } catch (error) {
    console.error("Ensure assessment error:", error);
    return NextResponse.json({ error: "Failed to ensure assessment" }, { status: 500 });
  }
}
