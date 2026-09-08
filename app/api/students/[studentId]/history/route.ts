import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  const { studentId } = await params;

  try {
    const assessments = await prisma.assessment.findMany({
      where: { studentId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        rubricKey: true,
        moment: true,
        createdAt: true,
        submittedAt: true,
        scores: { select: { id: true } },
        teacherReviews: {
          select: { status: true, publishedAt: true, feedback: true },
        },
      },
    });

    const result = assessments.map((a) => ({
      id: a.id,
      rubricKey: a.rubricKey,
      moment: a.moment,
      createdAt: a.createdAt,
      submittedAt: a.submittedAt,
      scoreCount: a.scores.length,
      published: a.teacherReviews.some((r) => r.status === "PUBLISHED"),
      draft: a.teacherReviews.some((r) => r.status === "DRAFT"),
    }));

    return NextResponse.json({ assessments: result });
  } catch (err) {
    console.error("GET /api/students/[studentId]/history failed:", err);
    return NextResponse.json({ error: "Failed to load history" }, { status: 500 });
  }
}
