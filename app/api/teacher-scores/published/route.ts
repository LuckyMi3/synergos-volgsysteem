import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const assessmentId = searchParams.get("assessmentId");

  if (!assessmentId) {
    return NextResponse.json({ error: "assessmentId is required" }, { status: 400 });
  }

  // Gate: alleen als review published is
  const review = await prisma.teacherReview.findUnique({ where: { assessmentId } });

  if (!review || review.status !== "PUBLISHED") {
    return NextResponse.json([]); // student ziet niks
  }

  const rows = await prisma.teacherScore.findMany({
    where: { assessmentId, teacherId: review.teacherId },
    orderBy: [{ themeId: "asc" }, { questionId: "asc" }],
  });

  return NextResponse.json(rows);
}
