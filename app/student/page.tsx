"use client";

import { useEffect, useMemo, useState } from "react";
import { rubric1VO } from "../../lib/rubrics/1vo";

type Moment = "M1" | "M2" | "M3";
type Status = "draft" | "published";

const MOCK_STUDENT = {
  id: "student-1",
  name: "Student Voorbeeld",
};

// Moet matchen met docentpage mock teacher id (voor nu)
const MOCK_TEACHER = {
  id: "teacher-1",
  name: "Docent Voorbeeld",
};

const STORAGE_KEY = "synergos_teacher_review_v1";

type TeacherItem = {
  score: number | null;
  feedback: string;
  status: Status;
  updatedAt: number;
  publishedAt?: number;
};

type TeacherStore = Record<string, TeacherItem>;

function makeKey(args: {
  studentId: string;
  teacherId: string;
  moment: Moment;
  themeId: string;
  questionId: string;
}) {
  const { studentId, teacherId, moment, themeId, questionId } = args;
  return `${studentId}__${teacherId}__${moment}__${themeId}__${questionId}`;
}

function scoreLabel(value: number) {
  const labels = rubric1VO.scale.labels;
  if (value <= 2) return labels[0];
  if (value <= 7) return labels[5];
  return labels[10];
}

function scoreColor(value: number) {
  if (value <= 2) return "#c0392b"; // rood
  if (value <= 7) return "#e67e22"; // oranje
  return "#27ae60"; // groen
}

function teacherScoreLabel(value: number | null) {
  if (value === null) return "–";
  return `${scoreLabel(value)} (${value})`;
}

function teacherScoreColor(value: number | null) {
  if (value === null) return "#999";
  return scoreColor(value);
}

export default function StudentPage() {
  const [moment, setMoment] = useState<Moment>("M1");
  const [openTheme, setOpenTheme] = useState<string | null>(null);
  const [scores, setScores] = useState<Record<string, number>>({});

  // docentstore (published items komen hieruit)
  const [teacherStore, setTeacherStore] = useState<TeacherStore>({});

  // dropdown open/close per vraag (per moment)
  const [openFeedback, setOpenFeedback] = useState<Record<string, boolean>>({});

  const moments: Moment[] = useMemo(() => ["M1", "M2", "M3"], []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as TeacherStore;
      setTeacherStore(parsed ?? {});
    } catch {
      // ignore
    }
  }, []);

  function setScore(key: string, value: number) {
    setScores((prev) => ({ ...prev, [key]: value }));
  }

  function getPublishedTeacherItem(args: {
    moment: Moment;
    themeId: string;
    questionId: string;
  }): TeacherItem | null {
    const key = makeKey({
      studentId: MOCK_STUDENT.id,
      teacherId: MOCK_TEACHER.id,
      moment: args.moment,
      themeId: args.themeId,
      questionId: args.questionId,
    });

    const item = teacherStore[key];
    if (!item) return null;
    if (item.status !== "published") return null;
    return item;
  }

  function toggleFeedback(rowKey: string) {
    setOpenFeedback((prev) => ({ ...prev, [rowKey]: !(prev[rowKey] ?? false) }));
  }

  return (
    <div style={{ padding: 32, maxWidth: 900, margin: "0 auto" }}>
      <h1>1VO - Vakopleiding Haptonomie</h1>

      <div style={{ marginBottom: 16 }}>
        <strong>Student:</strong> {MOCK_STUDENT.name}
      </div>

      {/* Meetmoment */}
      <div style={{ marginBottom: 24 }}>
        <strong>Meetmoment:</strong>{" "}
        {moments.map((m) => (
          <button
            key={m}
            onClick={() => setMoment(m)}
            style={{
              marginLeft: 8,
              padding: "6px 12px",
              background: moment === m ? "#111" : "#eee",
              color: moment === m ? "#fff" : "#000",
              border: "none",
              borderRadius: 6,
            }}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Thema's */}
      {rubric1VO.themes.map((theme) => (
        <div
          key={theme.id}
          style={{
            border: "1px solid #ddd",
            borderRadius: 8,
            marginBottom: 12,
            overflow: "hidden",
          }}
        >
          <div
            onClick={() => setOpenTheme(openTheme === theme.id ? null : theme.id)}
            style={{
              padding: 16,
              background: "#f5f5f5",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            {theme.title}
          </div>

          {openTheme === theme.id && (
            <div style={{ padding: 16 }}>
              {theme.questions.map((q) => {
                const key = `${moment}-${theme.id}-${q.id}`;
                const value = scores[key] ?? 5;

                const published = getPublishedTeacherItem({
                  moment,
                  themeId: theme.id,
                  questionId: q.id,
                });

                const rowKey = `${moment}__${theme.id}__${q.id}`;
                const isOpen = openFeedback[rowKey] ?? false;

                return (
                  <div
                    key={key}
                    style={{
                      marginBottom: 28,
                      paddingBottom: 16,
                      borderBottom: "1px solid #eee",
                    }}
                  >
                    {/* Vraag */}
                    <div style={{ marginBottom: 6, fontWeight: 600 }}>{q.text}</div>

                    {/* Jouw status */}
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 500,
                        marginBottom: 10,
                        color: "#000",
                      }}
                    >
                      Jouw huidige inschatting:{" "}
                      <span style={{ color: scoreColor(value) }}>
                        {scoreLabel(value)}
                      </span>
                    </div>

                    {/* Slider */}
                    <input
                      type="range"
                      min={rubric1VO.scale.min}
                      max={rubric1VO.scale.max}
                      value={value}
                      onChange={(e) => setScore(key, Number(e.target.value))}
                      style={{ width: "100%" }}
                    />

                    {/* Schaal-ankers */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: 12,
                        marginTop: 6,
                      }}
                    >
                      <span style={{ color: "#c0392b" }}>onbekwaam / niet eigen</span>
                      <span style={{ color: "#e67e22" }}>in ontwikkeling</span>
                      <span style={{ color: "#27ae60" }}>bekwaam / eigen</span>
                    </div>

                    {/* Docentlaag (alleen published) */}
                    <div style={{ marginTop: 14 }}>
                      <div
                        style={{
                          padding: 12,
                          border: "1px solid #eee",
                          borderRadius: 10,
                          background: "#fafafa",
                        }}
                      >
                        <div style={{ fontSize: 12, color: "#666", marginBottom: 6 }}>
                          Docent terugkoppeling ({moment})
                        </div>

                        <div style={{ fontSize: 13, marginBottom: 8 }}>
                          Docent correctie:{" "}
                          <span style={{ color: teacherScoreColor(published?.score ?? null) }}>
                            {teacherScoreLabel(published?.score ?? null)}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => toggleFeedback(rowKey)}
                          style={{
                            padding: "6px 10px",
                            background: "#fff",
                            border: "1px solid #ddd",
                            borderRadius: 8,
                            cursor: "pointer",
                            fontSize: 12,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          {isOpen ? "▾" : "▸"} Docent feedback
                          {published?.feedback?.trim() ? (
                            <span
                              style={{
                                fontSize: 12,
                                padding: "2px 8px",
                                borderRadius: 999,
                                background: "#f2f2f2",
                                border: "1px solid #ddd",
                                color: "#444",
                              }}
                            >
                              beschikbaar
                            </span>
                          ) : (
                            <span style={{ fontSize: 12, color: "#666" }}>geen</span>
                          )}
                        </button>

                        {isOpen && (
                          <div style={{ marginTop: 10 }}>
                            {published?.feedback?.trim() ? (
                              <div
                                style={{
                                  whiteSpace: "pre-wrap",
                                  fontSize: 13,
                                  lineHeight: 1.45,
                                  padding: 12,
                                  background: "#fff",
                                  border: "1px solid #eee",
                                  borderRadius: 10,
                                }}
                              >
                                {published.feedback}
                              </div>
                            ) : (
                              <div style={{ fontSize: 13, color: "#666", marginTop: 6 }}>
                                Er is (nog) geen gepubliceerde feedback voor deze vraag.
                              </div>
                            )}

                            {published?.publishedAt ? (
                              <div style={{ fontSize: 12, color: "#666", marginTop: 8 }}>
                                Gepubliceerd op{" "}
                                {new Date(published.publishedAt).toLocaleString("nl-NL")}
                                {" "}door {MOCK_TEACHER.name}
                              </div>
                            ) : null}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}

      <button
        onClick={() => alert("Opgeslagen (mock)")}
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
