import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(
  _req: Request,
  { params }: { params: { assessmentId: string } }
) {
  try {
    const updated = await prisma.assessment.update({
      where: { id: params.assessmentId },
      data: { submittedAt: new Date() },
      select: { id: true, submittedAt: true },
    });

    return NextResponse.json({ ok: true, assessment: updated });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: "Submit failed", detail: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}