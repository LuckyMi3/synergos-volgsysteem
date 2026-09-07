import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserIdFromCookies } from "@/lib/auth";
import { getSessionUserId } from "@/lib/auth/session";

export const runtime = "nodejs";

function fullName(u: any) {
    const parts = [u.voornaam, u.tussenvoegsel, u.achternaam].filter(Boolean);
    return parts.join(" ").trim();
}

export async function GET() {
    // Nieuwe sessie (student/docent login via /api/auth/login, of impersonation)
  const newSessionId = await getSessionUserId();

  // Oude sessie (admin login via /api/admin/auth/login)
  const oldSessionId = newSessionId ? null : await getUserIdFromCookies();

  const userId = newSessionId || oldSessionId || null;

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

                enrollments: {
                          select: {
                                      id: true,
                                      createdAt: true,
                                      cohort: {
                                                    select: {
                                                                    id: true,
                                                                    naam: true,
                                                                    traject: true,
                                                                    uitvoeringId: true,
                                                                    createdAt: true,
                                                    },
                                      },
                          },
                          orderBy: { createdAt: "desc" },
                },
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
                enrollments: user.enrollments,
        },
  });
}
