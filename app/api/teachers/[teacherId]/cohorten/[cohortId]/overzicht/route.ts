// app/api/teachers/[teacherId]/cohorten/[cohortId]/overzicht/route.ts
//
// Geeft per student in een cohort de status en score per moment (M1/M2/M3) terug,
// zodat de docent het hele cohort naast elkaar kan zien en op een student kan inzoomen.
//
// Aggregatie (cohortgemiddelde e.d.) gebeurt bewust client-side: cohorten zijn klein
// (tientallen studenten), dus dat houdt dit endpoint simpel en herbruikbaar.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { MomentStatusValue } from "@/lib/ui/moment-status";

type Moment = "M1" | "M2" | "M3";
const MOMENTEN: Moment[] = ["M1", "M2", "M3"];

function average(nums: number[]): number | null {
  if (!nums.length) return null;
  return Math.round((nums.reduce((s, n) => s + n, 0) / nums.length) * 10) / 10;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ teacherId: string; cohortId: string }> }
) {
  const { teacherId, cohortId } = await params;

  try {
    // Zelfde autorisatiepatroon als de andere teachers/[teacherId]-routes op deze
    // branch (geen requireStaff hier): teacherId moet zelf enrolled zijn in het cohort.
    const teacherEnrollment = await prisma.enrollment.findFirst({
      where: { userId: teacherId, cohortId },
      select: { id: true },
    });

    if (!teacherEnrollment) {
      return NextResponse.json({ error: "Geen toegang tot dit cohort" }, { status: 403 });
    }

    const cohort = await prisma.cohort.findUnique({
      where: { id: cohortId },
      select: { id: true, naam: true, traject: true },
    });

    if (!cohort) {
      return NextResponse.json({ error: "Cohort niet gevonden" }, { status: 404 });
    }

    const rubricKey = (cohort.traject || "1vo").toLowerCase().trim();

    const enrollments = await prisma.enrollment.findMany({
      where: { cohortId, user: { role: "STUDENT" } },
      include: { user: true },
    });

    const studentIds = enrollments.map((e) => e.userId);

    const assessments = studentIds.length
      ? await prisma.assessment.findMany({
          where: { studentId: { in: studentIds }, rubricKey },
          include: { scores: true, teacherScores: true, teacherReviews: true },
        })
      : [];

    const byStudent = new Map<string, typeof assessments>();
    for (const a of assessments) {
      if (!byStudent.has(a.studentId)) byStudent.set(a.studentId, []);
      byStudent.get(a.studentId)!.push(a);
    }

    const students = enrollments.map((enr) => {
      const studentAssessments = byStudent.get(enr.userId) ?? [];

      const perMoment = MOMENTEN.map((moment) => {
        const assessment = studentAssessments.find((a) => a.moment === moment);

        if (!assessment) {
          return {
            moment,
            status: "GEEN" as MomentStatusValue,
            submittedAt: null as string | null,
            score: null as number | null,
          };
        }

        const hasScores = assessment.scores.length > 0;
        const published = assessment.teacherReviews.some((r) => r.status === "PUBLISHED");
        const draft = assessment.teacherReviews.some((r) => r.status === "DRAFT");

        let status: MomentStatusValue;
        if (!hasScores) status = "LEEG";
        else if (published) status = "GEPUBLICEERD";
        else if (draft) status = "CONCEPT";
        else status = "INGEVULD";

        const selfAvg = average(assessment.scores.map((s) => s.score));
        const teacherAvg = average(
          assessment.teacherScores
            .map((s) => s.correctedScore)
            .filter((v): v is number => v != null)
        );

        return {
          moment,
          status,
          submittedAt: assessment.submittedAt ? assessment.submittedAt.toISOString() : null,
          score: status === "GEPUBLICEERD" ? teacherAvg ?? selfAvg : selfAvg,
        };
      });

      return {
        studentId: enr.userId,
        naam: [enr.user.voornaam, enr.user.tussenvoegsel, enr.user.achternaam]
          .filter(Boolean)
          .join(" "),
        coachNaam: enr.coachNaam,
        trajectStatus: enr.trajectStatus,
        assessmentLocked: enr.assessmentLocked,
        perMoment,
      };
    });

    return NextResponse.json({
      cohort: { id: cohort.id, naam: cohort.naam, traject: cohort.traject },
      students,
    });
  } catch (err) {
    console.error("GET /api/teachers/[teacherId]/cohorten/[cohortId]/overzicht failed:", err);
    return NextResponse.json({ error: "Failed to load cohort overview" }, { status: 500 });
  }
}
