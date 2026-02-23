import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";

export const runtime = "nodejs";

function sign(value: string, secret: string) {
  return crypto.createHmac("sha256", secret).update(value).digest("hex");
}

export async function POST(req: Request) {
  const { password } = await req.json().catch(() => ({}));
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";
  const SECRET = process.env.ADMIN_COOKIE_SECRET || "";

  if (!ADMIN_PASSWORD || !SECRET) {
    return NextResponse.json({ ok: false, error: "Admin auth not configured (env missing)" }, { status: 500 });
  }

  if (!password || String(password) !== ADMIN_PASSWORD) {
    return NextResponse.json({ ok: false, error: "Incorrect password" }, { status: 401 });
  }

  const payload = `admin:${Date.now()}`;
  const sig = sign(payload, SECRET);
  const token = `${payload}.${sig}`;

  // middleware cookie
  cookies().set("synergos_is_admin", "1", {
    httpOnly: false, // middleware can read normal cookie, but httpOnly is fine too; we keep this simple
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  // signed session cookie (httpOnly)
  cookies().set("synergos_admin_session", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  return NextResponse.json({ ok: true });
}