import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { PrismaClient } from "@prisma/client";

export const runtime = "nodejs";
const prisma = new PrismaClient();

function fullName(u: any) {
  const parts = [u.voornaam, u.tussenvoegsel, u.achternaam].filter(Boolean);
  return parts.join(" ").trim();
}

export async function GET() {
  const c = cookies();

  // tijdens impersonation is dit je effectieve user
  const actAsId = c.get("impersonate_user_id")?.value;

  // (later) echte login user id (als je dat gaat zetten)
  const realId = c.get("synergos_user_id")?.value;

  const userId = actAsId || realId;
  if (!userId) {
    return NextResponse.json({ ok: false, user: null });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      email: true,
      voornaam: true,
      tussenvoegsel: true,
      achternaam: true,
    },
  });

  if (!user) {
    return NextResponse.json({ ok: false, user: null });
  }

  return NextResponse.json({
    ok: true,
    user: {
      id: user.id,
      role: String(user.role),
      name: fullName(user) || user.email || user.id,
      email: user.email,
    },
  });
}