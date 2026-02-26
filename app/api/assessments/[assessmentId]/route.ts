import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  _req: Request,
  { params }: { params: { assessmentId: string } }
) {
  try {
    const a = await prisma.assessment.findUnique({
      where: { id: params.assessmentId },
      select: { id: true, submittedAt: true, rubricKey: true, moment: true, studentId: true },
    });

    if (!a) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

    return NextResponse.json({ ok: true, assessment: a });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: "Failed", detail: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}