"use client";

import { useState } from "react";
import { rubric1VO } from "../../lib/rubrics/1vo";

type Moment = "M1" | "M2" | "M3";

/* =========================
   MOCK STUDENTEN
========================= */

const MOCK_STUDENTS = [
  { id: "student-1", name: "Student Voorbeeld" },
  { id: "student-2", name: "Student Groeiend" },
  { id: "student-3", name: "Student Wisselend" },
];

/* =========================
   MOCK SCORES
   key = `${studentId}-${moment}-${themeId}-${questionId}`
========================= */

const MOCK_SCORES: Record<string, number> = {
  // Student 1 – stabiel
  "student-1-M1-lichaamsbewustzijn-lichaam_signaleren": 4,
  "student-1-M2-lichaamsbewustzijn-lichaam_signaleren": 6,
  "student-1-M3-lichaamsbewustzijn-lichaam_signaleren": 7,

  "student-1-M1-lichaamsbewustzijn-spanning_ontspanning": 5,
  "student-1-M2-lichaamsbewustzijn-spanning_ontspanning": 6,
  "student-1-M3-lichaamsbewustzijn-spanning_ontspanning": 6,

  // Student 2 – sterke groei
  "student-2-M1-lichaamsbewustzijn-lichaam_signaleren": 2,
  "student-2-M2-lichaamsbewustzijn-lichaam_signaleren": 5,
  "student-2-M3-lichaamsbewustzijn-lichaam_signaleren": 8,

  "student-2-M1-lichaamsbewustzijn-spanning_ontspanning": 3,
  "student-2-M2-lichaamsbewustzijn-spanning_ontspanning": 6,
  "student-2-M3-lichaamsbewustzijn-spanning_ontspanning": 9,

  // Student 3 – wisselend
  "student-3-M1-lichaamsbewustzijn-lichaam_signaleren": 6,
  "student-3-M2-lichaamsbewustzijn-lichaam_signaleren": 4,
  "student-3-M3-lichaamsbewustzijn-lichaam_signaleren": 6,

  "student-3-M1-lichaamsbewustzijn-spanning_ontspanning": 7,
  "student-3-M2-lichaamsbewustzijn-spanning_ontspanning": 5,
  "student-3-M3-lichaamsbewustzijn-spanning_ontspanning": 7,
};

export default function DocentPage() {
  const [moment, setMoment] = useState<Moment>("M1");
  const [selectedStudentId, setSelectedStudentId] = useState(
    MOCK_STUDENTS[0].id
  );

  const selectedStudent = MOCK_STUDENTS.find(
    (s) => s.id === selectedStudentId
  )!;

  function getScore(
    studentId: string,
    moment: Moment,
    themeId: string,
    questionId: string
  ) {
    return (
      MOCK_SCORES[
        `${studentId}-${moment}-${themeId}-${questionId}`
      ] ?? "-"
    );
  }

  return (
    <main style={{ padding: 32 }}>
      <h1 style={{ fontSize: 24, marginBottom: 16 }}>
        Docentweergave – 1VO Ontwikkelvolgsysteem
      </h1>

      {/* Student selectie */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ marginRight: 8 }}>Student:</label>
        <select
          value={selectedStudentId}
          onChange={(e) => setSelectedStudentId(e.target.value)}
        >
          {MOCK_STUDENTS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {/* Moment selectie */}
      <div style={{ marginBottom: 20 }}>
        {(["M1", "M2", "M3"] as Moment[]).map((m) => (
          <button
            key={m}
            onClick={() => setMoment(m)}
            style={{
              marginRight: 8,
              padding: "6px 12px",
              background: moment === m ? "#111" : "#eee",
              color: moment === m ? "#fff" : "#000",
              border: "none",
              cursor: "pointer",
            }}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Rubric */}
      {rubric1VO.themes.map((theme) => (
        <div key={theme.id} style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 18, marginBottom: 12 }}>
            {theme.title}
          </h2>

          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
            }}
          >
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: 8 }}>
                  Vraag
                </th>
                <th style={{ textAlign: "left", padding: 8 }}>
                  Score ({moment})
                </th>
              </tr>
            </thead>
            <tbody>
              {theme.questions.map((q) => (
                <tr key={q.id}>
                  <td style={{ padding: 8 }}>{q.title}</td>
                  <td style={{ padding: 8 }}>
                    {getScore(
                      selectedStudentId,
                      moment,
                      theme.id,
                      q.id
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </main>
  );
}
