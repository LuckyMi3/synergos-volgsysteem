import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";

export async function POST() {
  // Wist admin auth + impersonation
  const c = cookies();

  c.set("synergos_is_admin", "", { path: "/", maxAge: 0 });
  c.set("synergos_admin_session", "", { path: "/", maxAge: 0 });
  c.set("synergos_user_id", "", { path: "/", maxAge: 0 }); // indien je 'm gebruikt
  c.set("impersonate_user_id", "", { path: "/", maxAge: 0 });

  return NextResponse.json({ ok: true });
}