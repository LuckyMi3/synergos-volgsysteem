import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const assessmentId = searchParams.get("assessmentId");

  if (!assessmentId) {
    return NextResponse.json({ error: "assessmentId is required" }, { status: 400 });
  }

  const review = await prisma.teacherReview.findFirst({
    where: { assessmentId, status: "PUBLISHED" },
  });

  return NextResponse.json(review);
}
