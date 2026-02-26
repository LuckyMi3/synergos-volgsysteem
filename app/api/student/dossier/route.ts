import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { cookies } from "next/headers";

export const runtime = "nodejs";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// ✅ jouw cookie naam uit impersonate/start:
const IMPERSONATE_COOKIE = "impersonate_user_id";

// (optioneel) fallback als je later normale login cookie introduceert:
const USER_COOKIE = "user_id";

type MaxStage = "BASISJAAR" | "1VO" | "2VO" | "3VO" | null;

function trajectToStage(traject: string | null | undefined): MaxStage {
  const s = String(traject ?? "").toLowerCase();
  if (s.includes("3vo")) return "3VO";
  if (s.includes("2vo")) return "2VO";
  if (s.includes("1vo")) return "1VO";
  if (s.includes("basis")) return "BASISJAAR";
  return null;
}

function stageRank(stage: MaxStage) {
  if (stage === "BASISJAAR") return 0;
  if (stage === "1VO") return 1;
  if (stage === "2VO") return 2;
  if (stage === "3VO") return 3;
  return -1;
}

export async function GET() {
  const jar = await cookies();

  const userId =
    jar.get(IMPERSONATE_COOKIE)?.value?.trim() ||
    jar.get(USER_COOKIE)?.value?.trim() ||
    null;

  if (!userId) {
    return NextResponse.json({ ok: false, error: "NOT_AUTHENTICATED" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      voornaam: true,
      tussenvoegsel: true,
      achternaam: true,
      enrollments: {
        select: {
          id: true,
          cohort: {
            select: {
              id: true,
              naam: true,
              uitvoeringId: true,
              traject: true,
            },
          },
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ ok: false, error: "USER_NOT_FOUND" }, { status: 404 });
  }

  // ✅ zorg dat dossier record altijd bestaat
  const credential = await prisma.studentCredential.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });

  // ✅ maxStage bepalen obv hoogste traject in enrollments
  let maxStage: MaxStage = null;
  let best = -1;
  for (const e of user.enrollments) {
    const st = trajectToStage(e.cohort?.traject);
    const r = stageRank(st);
    if (r > best) {
      best = r;
      maxStage = st;
    }
  }

  return NextResponse.json({
    ok: true,
    user: {
      voornaam: user.voornaam,
      tussenvoegsel: user.tussenvoegsel,
      achternaam: user.achternaam,
    },
    enrollments: user.enrollments.map((e) => ({
      id: e.id,
      cohort: {
        id: e.cohort.id,
        naam: e.cohort.naam,
        uitvoeringId: e.cohort.uitvoeringId,
        traject: e.cohort.traject,
      },
    })),
    maxStage,
    credential,
  });
}