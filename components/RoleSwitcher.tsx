"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type PreviewRole = "admin" | "teacher" | "student";

/**
 * RoleSwitcher (voor nu): alleen voor preview/ontwikkeling.
 * - Toont niks tenzij:
 *   - NODE_ENV === "development", of
 *   - URL bevat ?preview=1
 * - Slaat niets op in localStorage/cookies (geen mock auth).
 * - Zet alleen een queryparam: ?asRole=student (of teacher/admin)
 *
 * Later kun je dit vervangen door een echte "Bekijk als student" knop voor docenten,
 * waarbij je in de UI conditioneel rendert obv (sessionRole + asRole).
 */
export default function RoleSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const previewEnabled = useMemo(() => {
    const flag = params.get("preview");
    return process.env.NODE_ENV === "development" || flag === "1";
  }, [params]);

  const asRole = (params.get("asRole") as PreviewRole | null) ?? null;

  if (!previewEnabled) return null;

  function setAsRole(r: PreviewRole | "") {
    const next = new URLSearchParams(params.toString());
    if (!r) next.delete("asRole");
    else next.set("asRole", r);
    // Zorg dat preview aan blijft als je hem gebruikt
    next.set("preview", "1");
    router.replace(`${pathname}?${next.toString()}`);
  }

  return (
    <div
      style={{
        position: "fixed",
        top: 12,
        right: 12,
        background: "#111",
        color: "#fff",
        padding: "10px 12px",
        borderRadius: 8,
        fontSize: 13,
        zIndex: 9999,
      }}
    >
      <div style={{ marginBottom: 6 }}>
        Preview als: <b>{asRole ?? "—"}</b>
      </div>

      <select
        value={asRole ?? ""}
        onChange={(e) => setAsRole(e.target.value as PreviewRole | "")}
      >
        <option value="">(uit)</option>
        <option value="student">Student</option>
        <option value="teacher">Docent</option>
        <option value="admin">Admin</option>
      </select>
    </div>
  );
}