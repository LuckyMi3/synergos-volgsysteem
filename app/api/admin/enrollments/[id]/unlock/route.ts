import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const enrollment = await prisma.enrollment.update({
      where: { id: params.id },
      data: {
        assessmentLocked: false,
      },
    });

    return NextResponse.json({ success: true, enrollment });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Unlock failed" },
      { status: 500 }
    );
  }
}