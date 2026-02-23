"use client";

import { useState } from "react";
import Link from "next/link";

type Row = {
  id: string;
  studentName: string;
  userId: string;
  cohortName: string;
  cohortId: string;
  uitvoeringId: string;
  assessmentLocked: boolean;
};

export default function AdminAssessmentsPage() {
  const [rows, setRows] = useState<Row[]>([]);

  async function fetchData() {
    const res = await fetch("/api/admin/assessments-data");
    const data = await res.json();
    setRows(data);
  }

  async function unlock(id: string) {
    await fetch(`/api/admin/enrollments/${id}/unlock`, {
      method: "POST",
    });

    setRows((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, assessmentLocked: false } : r
      )
    );
  }

  if (rows.length === 0) {
    fetchData();
  }

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ marginTop: 0 }}>Assessments</h1>

      <table style={{ width: "100%", marginTop: 20 }}>
        <thead>
          <tr style={{ textAlign: "left" }}>
            <th>Student</th>
            <th>Cohort</th>
            <th>Uitvoering</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((e) => (
            <tr key={e.id}>
              <td>
                <Link href={`/admin/users/${e.userId}`}>
                  {e.studentName}
                </Link>
              </td>
              <td>
                <Link href={`/admin/cohorts/${e.cohortId}`}>
                  {e.cohortName}
                </Link>
              </td>
              <td>{e.uitvoeringId}</td>
              <td>
                {e.assessmentLocked ? (
                  <span style={{ color: "red", fontWeight: 700 }}>
                    LOCKED
                  </span>
                ) : (
                  <span style={{ color: "green", fontWeight: 700 }}>
                    OPEN
                  </span>
                )}
              </td>
              <td>
                {e.assessmentLocked && (
                  <button
                    onClick={() => unlock(e.id)}
                    style={{
                      padding: "4px 8px",
                      borderRadius: 6,
                      cursor: "pointer",
                    }}
                  >
                    Unlock
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}