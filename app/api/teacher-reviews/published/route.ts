import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const assessmentId = searchParams.get("assessmentId")?.trim();
  const teacherId = searchParams.get("teacherId")?.trim(); // optioneel

  if (!assessmentId) {
    return NextResponse.json({ error: "assessmentId is required" }, { status: 400 });
  }

  if (teacherId) {
    const review = await prisma.teacherReview.findFirst({
      where: { assessmentId, teacherId, status: "PUBLISHED" },
    });
    return NextResponse.json(review);
  }

  const reviews = await prisma.teacherReview.findMany({
    where: { assessmentId, status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
  });

  return NextResponse.json(reviews);
}