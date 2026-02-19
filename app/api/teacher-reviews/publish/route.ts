import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const body = await req.json();
  const { assessmentId, teacherId } = body ?? {};

  if (!assessmentId || !teacherId) {
    return NextResponse.json(
      { error: "assessmentId and teacherId are required" },
      { status: 400 }
    );
  }

  const existing = await prisma.teacherReview.findUnique({ where: { assessmentId } });

  if (!existing) {
    return NextResponse.json({ error: "No draft review found" }, { status: 404 });
  }
  if (existing.teacherId !== teacherId) {
    return NextResponse.json(
      { error: "Review belongs to another teacherId" },
      { status: 403 }
    );
  }

  const review = await prisma.teacherReview.update({
    where: { assessmentId },
    data: {
      status: "PUBLISHED",
      publishedAt: new Date(),
    },
  });

  return NextResponse.json(review);
}
