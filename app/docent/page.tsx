"use client";

import { useState } from "react";
import { rubric1VO } from "../../lib/rubrics/1vo";

type Moment = "M1" | "M2" | "M3";

/**
 * MOCK data: zo doen we alsof we één student bekijken
 * Later komt dit uit Supabase / API
 */
const MOCK_STUDENT = {
  id: "student-1",
  name: "Student Voorbeeld",
};

/**
 * MOCK scores per meetmoment
 * key = `${moment}-${themeId}-${questionId}`
 */
const MOCK_SCORES: Record<string, number> = {
  "M1-lichaamsbewustzijn-lichaam_signaleren": 4,
  "M2-lichaamsbewustzijn-lichaam_signaleren": 6,
  "M3-lichaamsbewustzijn-lichaam_signaleren": 8,
};

export default function DocentPage() {
  const [openTheme, setOpenTheme] = useState<string | null>(null);
  const [themeFeedback, setThemeFeedback] = useState<Record<string, string>>(
    {}
  );
  const [questionFeedback, setQuestionFeedback] = useState<
    Record<string, string>
  >({});

  function getScore(
    moment: Moment,
    themeId: string,
    questionId: string
  ) {
    const key = `${moment}-${themeId}-${questionId}`;
    return MOCK_SCORES[key] ?? null;
  }

  return (
    <div style={{ padding: 32, maxWidth: 1000, margin: "0 auto" }}>
      <h1>Docentoverzicht – 1VO Vakopleiding</h1>

      <div style={{ marginBottom: 24 }}>
        <strong>Student:</strong> {MOCK_STUDENT.name}
      </div>

      {rubric1VO.themes.map((theme) => (
        <div
          key={theme.id}
          style={{
            border: "1px solid #ddd",
            borderRadius: 8,
            marginBottom: 16,
            overflow: "hidden",
          }}
        >
          {/* THEMA HEADER */}
          <div
            onClick={() =>
              setOpenTheme(openTheme === theme.id ? null : theme.id)
            }
            style={{
              padding: 16,
              background: "#f3f3f3",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            {theme.title}
          </div>

          {openTheme === theme.id && (
            <div style={{ padding: 16 }}>
              {/* VRAGEN */}
              {theme.questions.map((q) => (
                <div
                  key={q.id}
                  style={{
                    padding: 12,
                    borderBottom: "1px solid #eee",
                    marginBottom: 12,
                  }}
                >
                  <div style={{ marginBottom: 6 }}>
                    <strong>{q.text}</strong>
                  </div>

                  <div style={{ display: "flex", gap: 16, marginBottom: 8 }}>
                    {(["M1", "M2", "M3"] as Moment[]).map((m) => (
                      <div key={m}>
                        <div style={{ fontSize: 12 }}>{m}</div>
                        <div style={{ fontSize: 18 }}>
                          {getScore(m, theme.id, q.id) ?? "–"}
                        </div>
                      </div>
                    ))}
                  </div>

                  <textarea
                    placeholder="Feedback op deze vraag…"
                    value={questionFeedback[q.id] ?? ""}
                    onChange={(e) =>
                      setQuestionFeedback((prev) => ({
                        ...prev,
                        [q.id]: e.target.value,
                      }))
                    }
                    style={{
                      width: "100%",
                      minHeight: 60,
                      padding: 8,
                    }}
                  />
                </div>
              ))}

              {/* THEMA FEEDBACK */}
              <div style={{ marginTop: 16 }}>
                <strong>Feedback op thema</strong>
                <textarea
                  placeholder="Overkoepelende feedback op dit thema…"
                  value={themeFeedback[theme.id] ?? ""}
                  onChange={(e) =>
                    setThemeFeedback((prev) => ({
                      ...prev,
                      [theme.id]: e.target.value,
                    }))
                  }
                  style={{
                    width: "100%",
                    minHeight: 80,
                    padding: 8,
                    marginTop: 6,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      ))}

      <button
        onClick={() => alert("Feedback opgeslagen (mock)")}
        style={{
          marginTop: 24,
          padding: "10px 20px",
          background: "#111",
          color: "#fff",
          border: "none",
          borderRadius: 8,
        }}
      >
        Opslaan
      </button>
    </div>
  );
}
