import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/auth/requireStaff";

export async function POST(req: Request) {
  const auth = await requireStaff();
  if (auth.ok === false) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const assessmentId = typeof body?.assessmentId === "string" ? body.assessmentId.trim() : "";
    const teacherId = typeof body?.teacherId === "string" ? body.teacherId.trim() : "";

    if (!assessmentId || !teacherId) {
      return NextResponse.json(
        { error: "assessmentId and teacherId are required" },
        { status: 400 }
      );
    }

    if (auth.role !== "ADMIN" && teacherId !== auth.userId) {
      return NextResponse.json({ error: "Geen toegang" }, { status: 403 });
    }

    // Zorg dat assessment bestaat
    const assessment = await prisma.assessment.findUnique({ where: { id: assessmentId } });
    if (!assessment) {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
    }

    // Publiceer alleen je eigen review (of maak 'm aan als die nog niet bestaat)
    const review = await prisma.teacherReview.upsert({
      where: { assessment_teacher: { assessmentId, teacherId } },
      create: {
        assessmentId,
        teacherId,
        correctedScore: null,
        feedback: null,
        status: "PUBLISHED",
        publishedAt: new Date(),
      },
      update: {
        status: "PUBLISHED",
        publishedAt: new Date(),
      },
    });

    return NextResponse.json(review);
  } catch (error) {
    console.error("Publish teacher review error:", error);
    return NextResponse.json({ error: "Failed to publish teacher review" }, { status: 500 });
  }
}
