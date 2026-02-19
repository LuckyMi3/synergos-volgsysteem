import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const assessmentId = searchParams.get("assessmentId");
  const teacherId = searchParams.get("teacherId"); // optioneel

  if (!assessmentId) {
    return NextResponse.json({ error: "assessmentId is required" }, { status: 400 });
  }

  const rows = await prisma.teacherScore.findMany({
    where: {
      assessmentId,
      ...(teacherId ? { teacherId } : {}),
    },
    orderBy: [{ themeId: "asc" }, { questionId: "asc" }],
  });

  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { assessmentId, teacherId, themeId, questionId, correctedScore, feedback } = body ?? {};

  if (!assessmentId || !teacherId || !themeId || !questionId) {
    return NextResponse.json(
      { error: "assessmentId, teacherId, themeId, questionId are required" },
      { status: 400 }
    );
  }

  const row = await prisma.teacherScore.upsert({
    where: {
      assessmentId_teacherId_themeId_questionId: {
        assessmentId,
        teacherId,
        themeId,
        questionId,
      },
    },
    create: {
      assessmentId,
      teacherId,
      themeId,
      questionId,
      correctedScore: correctedScore ?? null,
      feedback: feedback ?? null,
    },
    update: {
      correctedScore: correctedScore ?? null,
      feedback: feedback ?? null,
    },
  });

  return NextResponse.json(row);
}
