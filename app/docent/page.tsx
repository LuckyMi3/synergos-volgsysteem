"use client";

import { useState } from "react";
import { rubric1VO } from "../../lib/rubrics/1vo";

type Moment = "M1" | "M2" | "M3";

const MOCK_STUDENT = {
  id: "student-1",
  name: "Student Voorbeeld",
};

/**
 * Mock scores
 * key = `${moment}-${themeId}-${questionId}`
 */
const MOCK_SCORES: Record<string, number> = {
  "M1-lichaamsbewustzijn-lichaam_signaleren": 4,
  "M2-lichaamsbewustzijn-lichaam_signaleren": 6,
  "M3-lichaamsbewustzijn-lichaam_signaleren": 8,

  "M1-lichaamsbewustzijn-spanning_ontspanning": 5,
  "M2-lichaamsbewustzijn-spanning_ontspanning": 6,
  "M3-lichaamsbewustzijn-spanning_ontspanning": 7,
};
function scoreLabel(value: number | null) {
  if (value === null) return "–";

  const labels = rubric1VO.scale.labels;

  if (value <= 2) return `${labels[0]} (${value})`;
  if (value <= 7) return `${labels[5]} (${value})`;
  return `${labels[10]} (${value})`;
}
function scoreColor(value: number | null) {
  if (value === null) return "#ccc";

  if (value <= 2) return "#c0392b";   // rood
  if (value <= 7) return "#e67e22";   // oranje
  return "#27ae60";                   // groen
}

function ProgressBar({ value }: { value: number | null }) {
  const v = value ?? 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div
        style={{
          height: 10,
          width: 120,
          background: "#eee",
          borderRadius: 4,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${(v / 10) * 100}%`,
            background: scoreColor(value),
          }}
        />
      </div>
      <div style={{ fontSize: 12 }}>{scoreLabel(value)}</div>
    </div>
  );
}

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

  function themeAverage(themeId: string, moment: Moment) {
    const scores = rubric1VO.themes
      .find((t) => t.id === themeId)!
      .questions.map((q) => getScore(moment, themeId, q.id))
      .filter((v): v is number => v !== null);

    if (!scores.length) return null;
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }

  return (
    <div style={{ padding: 32, maxWidth: 1100, margin: "0 auto" }}>
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
            marginBottom: 20,
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
              {/* THEMA GEMIDDELDE */}
              <div style={{ marginBottom: 16 }}>
                <strong>Thema – voortgang</strong>
                {(["M1", "M2", "M3"] as Moment[]).map((m) => (
                  <div key={m} style={{ marginTop: 6 }}>
                    <div style={{ fontSize: 12 }}>{m}</div>
                    <ProgressBar value={themeAverage(theme.id, m)} />
                  </div>
                ))}
              </div>

              {/* VRAGEN */}
              {theme.questions.map((q) => (
                <div
                  key={q.id}
                  style={{
                    padding: 12,
                    borderTop: "1px solid #eee",
                    marginTop: 12,
                  }}
                >
                  <div style={{ marginBottom: 6 }}>
                    <strong>{q.text}</strong>
                  </div>

                  {(["M1", "M2", "M3"] as Moment[]).map((m) => (
                    <div key={m} style={{ marginBottom: 4 }}>
                      <div style={{ fontSize: 12 }}>{m}</div>
                      <ProgressBar
                        value={getScore(m, theme.id, q.id)}
                      />
                    </div>
                  ))}

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
                      marginTop: 8,
                    }}
                  />
                </div>
              ))}

              {/* THEMA FEEDBACK */}
              <div style={{ marginTop: 20 }}>
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
