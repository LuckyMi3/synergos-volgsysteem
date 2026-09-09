import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth/session";
import { getUserIdFromCookies } from "@/lib/auth";

export type StaffAuthResult =
  | { ok: true; userId: string; role: "TEACHER" | "ADMIN" }
  | { ok: false; status: number; error: string };

/**
 * Verifieert dat de ingelogde gebruiker (via sessie, niet via een client-aangeleverd
 * ID) daadwerkelijk TEACHER of ADMIN is. Voorkomt dat een student via de URL of
 * directe API-calls bij docentfunctionaliteit kan (bijv. cijfers/feedback van
 * andere studenten bekijken of publiceren).
 */
export async function requireStaff(): Promise<StaffAuthResult> {
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

  if (!user || (user.role !== "TEACHER" && user.role !== "ADMIN")) {
    return { ok: false, status: 403, error: "Geen toegang (alleen docent/admin)" };
  }

  return { ok: true, userId: user.id, role: user.role as "TEACHER" | "ADMIN" };
}
