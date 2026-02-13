"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Role, getMockRole, setMockRole } from "../lib/currentUser";

export default function RoleSwitcher() {
  const router = useRouter();
  const [role, setRole] = useState<Role>("admin");

  useEffect(() => {
    setRole(getMockRole());
  }, []);

  function routeForRole(r: Role) {
    if (r === "admin") return "/admin";
    if (r === "teacher") return "/docent";
    return "/student";
  }

  function changeRole(r: Role) {
    setMockRole(r);
    setRole(r);
    router.replace(routeForRole(r));
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
      <div style={{ marginBottom: 6 }}>Actieve rol</div>
      <select
        value={role}
        onChange={(e) => changeRole(e.target.value as Role)}
      >
        <option value="admin">Admin</option>
        <option value="teacher">Docent</option>
        <option value="student">Student</option>
      </select>
    </div>
  );
}
