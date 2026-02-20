"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/cohorts", label: "Cohorts" },
  { href: "/admin/students", label: "Studenten" },
  { href: "/admin/assessments", label: "Assessments" },
  { href: "/admin/reviews", label: "Reviews" },
  { href: "/admin/locks", label: "Lock/Unlock" },
  { href: "/admin/teachers", label: "Docenten & koppelingen" },
];

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(href + "/");
}

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 8,
        padding: 10,
        border: "1px solid #eee",
        borderRadius: 12,
        background: "#fafafa",
        marginBottom: 18,
      }}
    >
      {tabs.map((t) => {
        const active = isActive(pathname, t.href);

        return (
          <Link
            key={t.href}
            href={t.href}
            style={{
              padding: "8px 10px",
              borderRadius: 10,
              border: active ? "1px solid #111" : "1px solid #ddd",
              background: active ? "#111" : "#fff",
              color: active ? "#fff" : "#111",
              textDecoration: "none",
              fontSize: 13,
              fontWeight: 800,
            }}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}