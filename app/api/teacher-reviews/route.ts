import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const assessmentId = searchParams.get("assessmentId");

  if (!assessmentId) {
    return NextResponse.json({ error: "assessmentId is required" }, { status: 400 });
  }

  const review = await prisma.teacherReview.findUnique({
    where: { assessmentId },
  });

  return NextResponse.json(review);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { assessmentId, teacherId, correctedScore, feedback } = body ?? {};

  if (!assessmentId || !teacherId) {
    return NextResponse.json(
      { error: "assessmentId and teacherId are required" },
      { status: 400 }
    );
  }

  // 🔹 NIEUW: check of assessment bestaat
  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
  });

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
    where: { assessmentId },
    create: {
      assessmentId,
      teacherId,
      correctedScore: correctedScore ?? null,
      feedback: feedback ?? null,
      status: "DRAFT",
      publishedAt: null,
    },
    update: {
      correctedScore: correctedScore ?? null,
      feedback: feedback ?? null,
      status: "DRAFT",
      publishedAt: null,
    },
  });

  // Ownership check (voorkomt overschrijven door andere teacherId)
  if (review.teacherId !== teacherId) {
    return NextResponse.json(
      { error: "Review belongs to another teacherId" },
      { status: 403 }
    );
  }

  return NextResponse.json(review);
}