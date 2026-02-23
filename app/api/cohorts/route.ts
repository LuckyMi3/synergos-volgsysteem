import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const cohorts = await prisma.cohort.findMany({
    orderBy: [{ createdAt: "desc" }, { naam: "asc" }],
  });
  return NextResponse.json({ ok: true, cohorts });
}

export async function POST(req: Request) {
  const body = await req.json();
  const { uitvoeringId, naam, traject } = body ?? {};

  if (!uitvoeringId || !naam) {
    return NextResponse.json(
      { ok: false, error: "uitvoeringId en naam zijn verplicht" },
      { status: 400 }
    );
  }

  const cohort = await prisma.cohort.upsert({
    where: { uitvoeringId: String(uitvoeringId) },
    create: {
      uitvoeringId: String(uitvoeringId),
      naam: String(naam),
      traject: traject ? String(traject) : null,
    },
    update: {
      naam: String(naam),
      traject: traject ? String(traject) : null,
    },
  });

  return NextResponse.json({ ok: true, cohort });
}