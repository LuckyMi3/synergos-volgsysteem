"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { badgeStyle, badgeLabel, type MomentStatusValue } from "@/lib/ui/moment-status";

type MeUser = { id: string; role: string; name?: string };

type Cohort = {
  id: string;
  naam: string;
  traject?: string | null;
  uitvoeringId: string;
};

type MomentStatus = MomentStatusValue;

type StudentRow = {
  id: string;
  name: string;
  email: string | null;
  moments: { M1: MomentStatus; M2: MomentStatus; M3: MomentStatus };
};

export default function DocentOverzichtPage() {
  const [me, setMe] = useState<MeUser | null>(null);
  const teacherId = me?.id || "";

  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [selectedCohortId, setSelectedCohortId] = useState<string>("");
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/me");
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;

        if (data?.ok && data?.user?.id) {
          setMe(data.user as MeUser);
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
      if (!teacherId) return;

      setStatus("Cohorts laden...");
      try {
        const res = await fetch(`/api/teachers/${encodeURIComponent(teacherId)}/cohorts`);
        const json = await res.json();
        const data: Cohort[] = Array.isArray(json?.cohorts) ? json.cohorts : [];
        if (cancelled) return;

        setCohorts(data);
        setSelectedCohortId((prev) => (prev ? prev : data[0]?.id ?? ""));
        setStatus(null);
      } catch {
        if (!cancelled) setStatus("Cohorts laden faalde.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [teacherId]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!teacherId || !selectedCohortId) return;

      setStatus("Studenten laden...");
      setStudents([]);

      try {
        const res = await fetch(
          `/api/teachers/${encodeURIComponent(
            teacherId
          )}/students-overview?cohortId=${encodeURIComponent(selectedCohortId)}`
        );
        const json = await res.json().catch(() => ({}));

        if (!res.ok) {
          if (!cancelled) {
            setStatus(`Laden faalde (${res.status}): ${json?.error ?? "onbekend"}`);
          }
          return;
        }

        if (cancelled) return;
        setStudents(Array.isArray(json?.students) ? json.students : []);
        setStatus(null);
      } catch {
        if (!cancelled) setStatus("Studenten laden faalde.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [teacherId, selectedCohortId]);

  const selectedCohort = cohorts.find((c) => c.id === selectedCohortId) || null;

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
        <h1 style={{ fontSize: 24 }}>Studentenoverzicht</h1>
        <Link href="/docent" style={{ fontSize: 13, color: "#666" }}>
          Naar losse beoordeling &rarr;
        </Link>
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={{ marginRight: 8 }}>Cohort:</label>
        <select
          value={selectedCohortId}
          onChange={(e) => setSelectedCohortId(e.target.value)}
          disabled={cohorts.length === 0}
        >
          {cohorts.length === 0 ? (
            <option value="">(geen cohorts)</option>
          ) : (
            cohorts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.naam}
              </option>
            ))
          )}
        </select>
        {selectedCohortId ? (
          <Link
            href={`/docent/cohorten/${encodeURIComponent(selectedCohortId)}`}
            style={{ marginLeft: 12, fontSize: 13, color: "#666" }}
          >
            Cohort-overzicht &rarr;
          </Link>
        ) : null}
      </div>

      {status ? (
        <div style={{ marginBottom: 16, fontSize: 13, color: "#666" }}>{status}</div>
      ) : null}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: 14,
        }}
      >
        {students.map((s) => (
          <Link
            key={s.id}
            href={`/docent?studentId=${encodeURIComponent(s.id)}&cohortId=${encodeURIComponent(
              selectedCohortId
            )}`}
            style={{
              display: "block",
              padding: 16,
              border: "1px solid #e5e7eb",
              borderRadius: 12,
              textDecoration: "none",
              color: "#111",
              background: "#fff",
            }}
          >
            <div style={{ fontWeight: 800, marginBottom: 10 }}>{s.name}</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {(["M1", "M2", "M3"] as const).map((m) => (
                <span
                  key={m}
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "3px 8px",
                    borderRadius: 999,
                    ...badgeStyle(s.moments[m]),
                  }}
                >
                  {m}: {badgeLabel(s.moments[m])}
                </span>
              ))}
            </div>
          </Link>
        ))}
      </div>

      {selectedCohort && students.length === 0 && !status ? (
        <div style={{ color: "#666", fontSize: 13, marginTop: 16 }}>
          Geen studenten in dit cohort.
        </div>
      ) : null}
    </main>
  );
}
