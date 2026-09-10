import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/requireUser";

export async function GET(req: Request) {
  const auth = await requireUser();
  if (auth.ok === false) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(req.url);
    const assessmentId = searchParams.get("assessmentId")?.trim();

    if (!assessmentId) {
      return NextResponse.json({ error: "assessmentId is required" }, { status: 400 });
    }

    if (auth.role === "STUDENT") {
      const assessment = await prisma.assessment.findUnique({
        where: { id: assessmentId },
        select: { studentId: true },
      });
      if (!assessment || assessment.studentId !== auth.userId) {
        return NextResponse.json({ error: "Geen toegang" }, { status: 403 });
      }
    }

    const scores = await prisma.score.findMany({
      where: { assessmentId },
      orderBy: [{ themeId: "asc" }, { questionId: "asc" }],
    });

    return NextResponse.json(scores);
  } catch (error) {
    console.error("Error fetching scores:", error);
    return NextResponse.json({ error: "Failed to fetch scores" }, { status: 500 });
  }
}
