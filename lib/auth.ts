import crypto from "crypto";
import { PrismaClient } from "@prisma/client";
import { cookies } from "next/headers";

const prisma = new PrismaClient();

function sign(value: string, secret: string) {
  return crypto.createHmac("sha256", secret).update(value).digest("hex");
}

function verifyAdminSession(token: string) {
  const SECRET = process.env.ADMIN_COOKIE_SECRET || "";
  if (!SECRET) return false;

  const parts = token.split(".");
  if (parts.length !== 2) return false;

  const [payload, sig] = parts;
  const expected = sign(payload, SECRET);
  return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
}

export async function requireAdminAuth() {
  const c = cookies();

  const isAdminCookie = c.get("synergos_is_admin")?.value === "1";
  const adminSession = c.get("synergos_admin_session")?.value || "";

  if (!isAdminCookie || !adminSession || !verifyAdminSession(adminSession)) {
    throw new Error("NOT_ADMIN");
  }

  // Optional: if you also have a real user id, fetch it (nice for audit)
  const realUserId = c.get("synergos_user_id")?.value || "";
  const realUser = realUserId ? await prisma.user.findUnique({ where: { id: realUserId } }) : null;

  const actAsUserId = c.get("impersonate_user_id")?.value || "";
  const actAsUser = actAsUserId ? await prisma.user.findUnique({ where: { id: actAsUserId } }) : null;

  return {
    realUser, // can be null in break-glass mode
    actAsUser,
    effectiveUser: actAsUser ?? realUser,
    isImpersonating: !!actAsUser,
  };
}