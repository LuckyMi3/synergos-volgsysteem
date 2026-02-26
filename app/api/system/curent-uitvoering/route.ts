import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

export const runtime = "nodejs";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Gebruik dezelfde key als je admin endpoint gebruikt
const KEY = "current-uitvoering";

export async function GET() {
  const row = await prisma.systemSetting.findUnique({
    where: { key: KEY },
    select: { value: true },
  });

  // zelfde shape als jij eerder zag: { ok:true, uitvoeringId:"25/26" }
  return NextResponse.json({
    ok: true,
    uitvoeringId: row?.value ?? null,
  });
}