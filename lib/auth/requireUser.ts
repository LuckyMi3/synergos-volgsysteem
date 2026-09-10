import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth/session";
import { getUserIdFromCookies } from "@/lib/auth";

export type UserAuthResult =
  | { ok: true; userId: string; role: "STUDENT" | "TEACHER" | "ADMIN" }
  | { ok: false; status: number; error: string };

/**
 * Verifieert dat er een ingelogde gebruiker is, ongeacht rol.
 * In tegenstelling tot requireStaff() accepteert dit ook studenten -
 * gebruik dit voor endpoints die zowel door studenten (eigen data) als
 * door docenten/admins (andermans data) gebruikt worden, en doe de
 * eigenaarschap-check (auth.userId === ...) zelf in de route.
 */
export async function requireUser(): Promise<UserAuthResult> {
  const newSessionId = await getSessionUserId();
  const oldSessionId = newSessionId ? null : await getUserIdFromCookies();
  const userId = newSessionId || oldSessionId || null;

  if (!userId) {
    return { ok: false, status: 401, error: "Niet ingelogd" };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });

  if (!user) {
    return { ok: false, status: 401, error: "Niet ingelogd" };
  }

  return { ok: true, userId: user.id, role: user.role as "STUDENT" | "TEACHER" | "ADMIN" };
}

