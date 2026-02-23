import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const cohorts = await prisma.cohort.findMany({
    orderBy: [{ createdAt: "desc" }, { naam: "asc" }],
  });
  return NextResponse.json(cohorts);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { title, rubricKey, year } = body ?? {};

  if (!title || !rubricKey || !year) {
    return NextResponse.json(
      { error: "title, rubricKey, year are required" },
      { status: 400 }
    );
  }

  const cohort = await prisma.cohort.upsert({
    where: {
      rubricKey_year: {
        rubricKey,
        year: Number(year),
      },
    },
    create: {
      title,
      rubricKey,
      year: Number(year),
    },
    update: {
      title,
    },
  });

  return NextResponse.json(cohort);
}
