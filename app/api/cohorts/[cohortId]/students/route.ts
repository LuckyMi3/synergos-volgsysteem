import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

export const runtime = "nodejs";
const prisma = new PrismaClient();

export async function POST(
  req: Request,
  { params }: { params: { cohortId: string } }
) {
  try {
    const cohortId = params.cohortId;
    const body = await req.json();
    const studentIds = (body?.studentIds ?? []) as string[];

    if (!cohortId) {
      return NextResponse.json({ ok: false, error: "Missing cohortId" }, { status: 400 });
    }
    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return NextResponse.json({ ok: false, error: "Missing studentIds[]" }, { status: 400 });
    }

    // Kies 1 van deze twee — afhankelijk van jouw Enrollment schema:
    // A) Enrollment heeft userId:
    await prisma.enrollment.createMany({
      data: studentIds.map((studentId) => ({
        cohortId,
        userId: studentId,
      })),
      skipDuplicates: true,
    });

    // B) Enrollment heeft studentId (als jouw veld zo heet):
    // await prisma.enrollment.createMany({
    //   data: studentIds.map((studentId) => ({
    //     cohortId,
    //     studentId,
    //   })),
    //   skipDuplicates: true,
    // });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}