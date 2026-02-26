import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

export const runtime = "nodejs";
const prisma = new PrismaClient();

const KEY = "CURRENT_UITVOERING_ID";
const DEFAULT_VALUE = "25/26";

export async function GET() {
  const setting = await prisma.systemSetting.upsert({
    where: { key: KEY },
    update: {},
    create: { key: KEY, value: DEFAULT_VALUE },
  });

  return NextResponse.json({ ok: true, uitvoeringId: setting.value });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const uitvoeringId = String(body?.uitvoeringId ?? "").trim();

  if (!uitvoeringId) {
    return NextResponse.json(
      { ok: false, error: "uitvoeringId ontbreekt" },
      { status: 400 }
    );
  }

  const setting = await prisma.systemSetting.upsert({
    where: { key: KEY },
    update: { value: uitvoeringId },
    create: { key: KEY, value: uitvoeringId },
  });

  return NextResponse.json({ ok: true, uitvoeringId: setting.value });
}