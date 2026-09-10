import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/auth/requireStaff";

export async function GET(req: Request) {
  const auth = await requireStaff();
  if (auth.ok === false) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(req.url);
    const assessmentId = searchParams.get("assessmentId")?.trim();
    const teacherId = searchParams.get("teacherId")?.trim();

    if (!assessmentId) {
      return NextResponse.json({ error: "assessmentId is required" }, { status: 400 });
    }
    if (!teacherId) {
      return NextResponse.json({ error: "teacherId is required" }, { status: 400 });
    }
    if (auth.role !== "ADMIN" && teacherId !== auth.userId) {
      return NextResponse.json({ error: "Geen toegang" }, { status: 403 });
    }

    const review = await prisma.teacherReview.findUnique({
      // ✅ matcht schema: @@unique([assessmentId, teacherId], name: "assessment_teacher")
      where: { assessment_teacher: { assessmentId, teacherId } },
    });

    return NextResponse.json(review);
  } catch (error) {
    console.error("Error fetching teacher review:", error);
    return NextResponse.json({ error: "Failed to fetch teacher review" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireStaff();
  if (auth.ok === false) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const assessmentId = typeof body?.assessmentId === "string" ? body.assessmentId.trim() : "";
    const teacherId = typeof body?.teacherId === "string" ? body.teacherId.trim() : "";

    const correctedScore =
      typeof body?.correctedScore === "number" ? body.correctedScore : null;
    const feedback = typeof body?.feedback === "string" ? body.feedback : null;

    if (!assessmentId || !teacherId) {
      return NextResponse.json(
        { error: "assessmentId and teacherId are required" },
        { status: 400 }
      );
    }

    if (auth.role !== "ADMIN" && teacherId !== auth.userId) {
      return NextResponse.json({ error: "Geen toegang" }, { status: 403 });
    }

    // Check assessment bestaat (jouw bestaande UX-melding)
    const assessment = await prisma.assessment.findUnique({ where: { id: assessmentId } });
    if (!assessment) {
      return NextResponse.json(
        {
          code: "ASSESSMENT_NOT_FOUND",
          message:
            "Deze student heeft het volgsysteem nog niet geopend voor dit onderdeel. Neem rechtstreeks contact op met de student en motiveer om het volgsysteem te bekijken; pas daarna kan feedback worden opgeslagen.",
        },
        { status: 400 }
      );
    }

    // Draft-save = altijd DRAFT + publishedAt leegmaken
    const review = await prisma.teacherReview.upsert({
      where: { assessment_teacher: { assessmentId, teacherId } },
      create: {
        assessmentId,
        teacherId,
        correctedScore,
        feedback: feedback?.trim() ? feedback : null,
        status: "DRAFT",
        publishedAt: null,
      },
      update: {
        correctedScore,
        feedback: feedback?.trim() ? feedback : null,
        status: "DRAFT",
        publishedAt: null,
      },
    });

    return NextResponse.json(review);
  } catch (error) {
    console.error("TeacherReview upsert error:", error);
    return NextResponse.json({ error: "Failed to save teacher review" }, { status: 500 });
  }
}
