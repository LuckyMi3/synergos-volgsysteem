// app/(teacher)/docent/cohorten/[cohortId]/page.tsx
//
// Cohort-overzicht: alle studenten van één cohort naast elkaar, met filter/zoek/sorteer
// en een uitklapbaar paneel per student om te vergelijken met het cohortgemiddelde.
//
// TODO: het uitklappaneel heeft een plek voor een thema-voor-thema vergelijking
// (bv. een recharts BarChart met student vs cohortgemiddelde per thema) — daarvoor
// is een aparte call nodig die scores per thema teruggeeft, of breid het
// overzicht-endpoint uit met een `scoresPerThema` veld.

"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { badgeStyle, badgeLabel, type MomentStatusValue } from "@/lib/ui/moment-status";

type Moment = "M1" | "M2" | "M3";
const MOMENTEN: Moment[] = ["M1", "M2", "M3"];

type MeUser = { id: string; role: string; name?: string };

type MomentStatus = {
  moment: Moment;
  status: MomentStatusValue;
  submittedAt: string | null;
  score: number | null;
};

type StudentRow = {
  studentId: string;
  naam: string;
  coachNaam: string | null;
  trajectStatus: string | null;
  assessmentLocked: boolean;
  perMoment: MomentStatus[];
};

type CohortOverzicht = {
  cohort: { id: string; naam: string; traject: string | null };
  students: StudentRow[];
};

function overallScore(row: StudentRow): number | null {
  const scores = row.perMoment.map((m) => m.score).filter((v): v is number => v != null);
  if (!scores.length) return null;
  return Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10;
}

export default function CohortOverzichtPage() {
  const { cohortId } = useParams<{ cohortId: string }>();

  const [me, setMe] = useState<MeUser | null>(null);
  const teacherId = me?.id || "";

  const [data, setData] = useState<CohortOverzicht | null>(null);
  const [status, setStatus] = useState<string | null>("Laden...");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"alle" | "te_beoordelen" | "afgerond">("alle");
  const [sortKey, setSortKey] = useState<"naam" | "score">("naam");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/me");
        const json = await res.json().catch(() => ({}));
        if (cancelled) return;

        if (json?.ok && json?.user?.id) {
          setMe(json.user as MeUser);
        } else {
          setStatus("Geen ingelogde user gevonden.");
        }
      } catch {
        if (!cancelled) setStatus("User laden faalde.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!teacherId || !cohortId) return;

      setStatus("Cohort laden...");
      try {
        const res = await fetch(
          `/api/teachers/${encodeURIComponent(teacherId)}/cohorten/${encodeURIComponent(
            cohortId
          )}/overzicht`
        );
        const json = await res.json().catch(() => ({}));

        if (!res.ok) {
          if (!cancelled) setStatus(`Laden faalde (${res.status}): ${json?.error ?? "onbekend"}`);
          return;
        }

        if (cancelled) return;
        setData(json as CohortOverzicht);
        setStatus(null);
      } catch {
        if (!cancelled) setStatus("Cohort laden faalde.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [teacherId, cohortId]);

  const cohortGemiddelde = useMemo(() => {
    if (!data) return null;
    const alle = data.students.map(overallScore).filter((v): v is number => v != null);
    return alle.length ? Math.round((alle.reduce((a, b) => a + b, 0) / alle.length) * 10) / 10 : null;
  }, [data]);

  const rows = useMemo(() => {
    if (!data) return [];
    let filtered = data.students.filter((s) => s.naam.toLowerCase().includes(search.toLowerCase()));

    if (statusFilter === "te_beoordelen") {
      filtered = filtered.filter((s) =>
        s.perMoment.some((m) => m.status === "INGEVULD" || m.status === "CONCEPT")
      );
    }
    if (statusFilter === "afgerond") {
      filtered = filtered.filter((s) => s.perMoment.every((m) => m.status === "GEPUBLICEERD"));
    }

    return [...filtered].sort((a, b) =>
      sortKey === "naam" ? a.naam.localeCompare(b.naam, "nl") : (overallScore(b) ?? -1) - (overallScore(a) ?? -1)
    );
  }, [data, search, statusFilter, sortKey]);

  if (status && !data) {
    return <main style={{ padding: 32 }}><div style={{ fontSize: 13, color: "#666" }}>{status}</div></main>;
  }
  if (!data) {
    return <main style={{ padding: 32 }}><div style={{ fontSize: 13, color: "#666" }}>Cohort niet gevonden.</div></main>;
  }

  return (
    <main style={{ padding: 32, maxWidth: 1100, margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20,
        }}
      >
        <div>
          <h1 style={{ fontSize: 24 }}>{data.cohort.naam}</h1>
          <p style={{ fontSize: 13, color: "#666" }}>
            {data.cohort.traject} · {data.students.length} studenten
            {cohortGemiddelde != null && ` · cohortgemiddelde ${cohortGemiddelde}`}
          </p>
        </div>
        <Link href="/docent/overzicht" style={{ fontSize: 13, color: "#666" }}>
          &larr; Terug naar overzicht
        </Link>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <input
          style={{ border: "1px solid #e5e7eb", borderRadius: 6, padding: "6px 10px", fontSize: 13 }}
          placeholder="Zoek op naam..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          style={{ border: "1px solid #e5e7eb", borderRadius: 6, padding: "6px 10px", fontSize: 13 }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
        >
          <option value="alle">Alle statussen</option>
          <option value="te_beoordelen">Te beoordelen</option>
          <option value="afgerond">Afgerond</option>
        </select>
        <select
          style={{ border: "1px solid #e5e7eb", borderRadius: 6, padding: "6px 10px", fontSize: 13 }}
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as typeof sortKey)}
        >
          <option value="naam">Sorteer op naam</option>
          <option value="score">Sorteer op score</option>
        </select>
      </div>

      {status ? <div style={{ marginBottom: 16, fontSize: 13, color: "#666" }}>{status}</div> : null}

      <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>
            <th style={{ padding: "8px 0" }}>Student</th>
            <th>Coach</th>
            {MOMENTEN.map((m) => (
              <th key={m}>{m}</th>
            ))}
            <th>Gem. score</th>
            <th>t.o.v. cohort</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const score = overallScore(row);
            const delta = score != null && cohortGemiddelde != null ? score - cohortGemiddelde : null;

            return (
              <Fragment key={row.studentId}>
                <tr
                  style={{ borderBottom: "1px solid #f3f4f6", cursor: "pointer" }}
                  onClick={() => setExpanded(expanded === row.studentId ? null : row.studentId)}
                >
                  <td style={{ padding: "8px 0" }}>{row.naam}</td>
                  <td>{row.coachNaam ?? "–"}</td>
                  {row.perMoment.map((m) => (
                    <td key={m.moment}>
                      <span
                        style={{
                          display: "inline-block",
                          fontSize: 11,
                          fontWeight: 700,
                          padding: "3px 8px",
                          borderRadius: 999,
                          ...badgeStyle(m.status),
                        }}
                      >
                        {badgeLabel(m.status)}
                      </span>
                    </td>
                  ))}
                  <td>{score ?? "–"}</td>
                  <td>
                    {delta == null ? (
                      "–"
                    ) : (
                      <span style={{ color: delta > 0 ? "#16a34a" : delta < 0 ? "#dc2626" : "#9ca3af" }}>
                        {delta > 0 ? "↑" : delta < 0 ? "↓" : "≈"} {Math.abs(delta).toFixed(1)}
                      </span>
                    )}
                  </td>
                  <td>
                    <Link
                      href={`/docent?studentId=${encodeURIComponent(row.studentId)}&cohortId=${encodeURIComponent(
                        data.cohort.id
                      )}`}
                      style={{ color: "#1d4ed8", textDecoration: "none" }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      Dossier &rarr;
                    </Link>
                  </td>
                </tr>
                {expanded === row.studentId && (
                  <tr>
                    <td colSpan={8} style={{ background: "#fafafa", padding: 16, fontSize: 13, color: "#666" }}>
                      {/* TODO: thema-voor-thema vergelijking (student vs cohortgemiddelde) */}
                      Detailvergelijking per thema komt hier — bv. een bar chart met deze
                      student naast het cohortgemiddelde per thema.
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>

      {rows.length === 0 && !status ? (
        <div style={{ color: "#666", fontSize: 13, marginTop: 16 }}>Geen studenten gevonden.</div>
      ) : null}
    </main>
  );
}
