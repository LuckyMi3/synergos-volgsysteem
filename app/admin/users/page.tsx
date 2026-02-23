import React from "react";
import { PrismaClient, Role } from "@prisma/client";
import ImpersonateInlineLink from "../_components/ImpersonateInlineLink";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

function fullName(u: any) {
  const parts = [u.voornaam, u.tussenvoegsel, u.achternaam].filter(Boolean);
  return parts.join(" ").trim();
}

type SortKey = "name_asc" | "name_desc" | "rel_asc" | "rel_desc";

function buildHref(basePath: string, params: Record<string, string | undefined>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v && v.length) sp.set(k, v);
  }
  const qs = sp.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams?: { role?: string; sort?: string; showEmail?: string };
}) {
  const basePath = "/admin/users";

  const roleParam = (searchParams?.role ?? "ALL").toUpperCase();
  const sort = (searchParams?.sort ?? "name_asc") as SortKey;
  const showEmail = searchParams?.showEmail === "1";

  const roleFilter: Role | null =
    roleParam === "STUDENT" || roleParam === "TEACHER" || roleParam === "ADMIN"
      ? (roleParam as Role)
      : null;

  const orderBy =
    sort === "name_desc"
      ? [{ achternaam: "desc" as const }, { voornaam: "desc" as const }]
      : sort === "rel_asc"
      ? [{ crmCustomerId: "asc" as const }, { achternaam: "asc" as const }, { voornaam: "asc" as const }]
      : sort === "rel_desc"
      ? [{ crmCustomerId: "desc" as const }, { achternaam: "asc" as const }, { voornaam: "asc" as const }]
      : [{ achternaam: "asc" as const }, { voornaam: "asc" as const }];

  const users = await prisma.user.findMany({
    where: roleFilter ? { role: roleFilter } : undefined,
    orderBy,
    select: {
      id: true,
      email: true,
      role: true,
      crmCustomerId: true,
      voornaam: true,
      tussenvoegsel: true,
      achternaam: true,
      createdAt: true,
    },
  });

  const label: React.CSSProperties = { fontSize: 12, color: "#666" };

  const activeChip: React.CSSProperties = {
    border: "1px solid #111",
    background: "#111",
    color: "white",
  };

  const chip: React.CSSProperties = {
    border: "1px solid #e5e7eb",
    borderRadius: 999,
    padding: "6px 10px",
    fontSize: 12,
    textDecoration: "none",
    color: "#111",
    background: "white",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
        <h2 style={{ marginTop: 0, marginBottom: 10 }}>Users</h2>
        <div style={label}>{users.length} zichtbaar</div>
      </div>

      {/* Filters + sort */}
      <div
        style={{
          border: "1px solid #eee",
          borderRadius: 12,
          padding: 12,
          display: "flex",
          flexWrap: "wrap",
          gap: 10,
          alignItems: "center",
          marginBottom: 12,
          background: "white",
        }}
      >
        <div style={{ ...label, marginRight: 6 }}>Filter</div>

        {/* Role chips */}
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          {(["ALL", "STUDENT", "TEACHER", "ADMIN"] as const).map((r) => {
            const active = roleParam === r;
            return (
              <a
                key={r}
                href={buildHref(basePath, {
                  role: r === "ALL" ? undefined : r,
                  sort,
                  showEmail: showEmail ? "1" : undefined,
                })}
                style={{ ...chip, ...(active ? activeChip : {}) }}
              >
                {r === "ALL" ? "Alle" : r}
              </a>
            );
          })}
        </div>

        {/* Sort chips */}
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginLeft: 6 }}>
          <div style={label}>Sort</div>

          {(
            [
              ["name_asc", "Naam A→Z"],
              ["name_desc", "Naam Z→A"],
              ["rel_asc", "Relatienr ↑"],
              ["rel_desc", "Relatienr ↓"],
            ] as const
          ).map(([key, text]) => {
            const active = sort === key;
            return (
              <a
                key={key}
                href={buildHref(basePath, {
                  role: roleFilter ?? undefined,
                  sort: key,
                  showEmail: showEmail ? "1" : undefined,
                })}
                style={{ ...chip, ...(active ? activeChip : {}) }}
              >
                {text}
              </a>
            );
          })}
        </div>

        {/* Email toggle */}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={label}>Email</span>
          <a
            href={buildHref(basePath, {
              role: roleFilter ?? undefined,
              sort,
              showEmail: showEmail ? undefined : "1",
            })}
            style={{ ...chip, ...(showEmail ? activeChip : {}) }}
            title={showEmail ? "Verberg email kolom" : "Toon email kolom"}
          >
            {showEmail ? "Verbergen" : "Tonen"}
          </a>
        </div>
      </div>

      {/* Table */}
      <div style={{ border: "1px solid #eee", borderRadius: 12, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#fafafa" }}>
              <th style={th}>Naam</th>
              <th style={th}>Rol</th>
              {showEmail && <th style={th}>Email</th>}
              <th style={th}>Relatienummer</th>
            </tr>
          </thead>

          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td style={td}>
                  <div style={{ display: "flex", gap: 10, alignItems: "baseline", flexWrap: "wrap" }}>
                    <div style={{ fontWeight: 900 }}>{fullName(u) || "—"}</div>

                    {/* "meekijken" link blijft ingebakken */}
                    <ImpersonateInlineLink userId={u.id} label="meekijken" redirectTo="/" />

                    <span style={{ fontSize: 12, color: "#bbb" }}>•</span>

                    <a
                      href={`/admin/users/${u.id}`}
                      style={{ fontSize: 12, fontWeight: 900, textDecoration: "none", opacity: 0.85 }}
                      title="Open user details"
                    >
                      open
                    </a>
                  </div>

                  <div style={{ fontSize: 12, color: "#666" }}>{u.id}</div>
                </td>

                <td style={td}>{String(u.role)}</td>

                {showEmail && <td style={td}>{u.email || "—"}</td>}

                <td style={td}>{u.crmCustomerId || "—"}</td>
              </tr>
            ))}

            {users.length === 0 && (
              <tr>
                <td style={td} colSpan={showEmail ? 4 : 3}>
                  Geen users gevonden.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const th: React.CSSProperties = {
  textAlign: "left",
  padding: "10px 12px",
  fontSize: 12,
  color: "#666",
  borderBottom: "1px solid #eee",
};

const td: React.CSSProperties = {
  padding: "10px 12px",
  borderBottom: "1px solid #f0f0f0",
  verticalAlign: "top",
};