"use client";

import { useEffect, useMemo, useState } from "react";
import { rubric1VO } from "../../lib/rubrics/1vo";

type Moment = "M1" | "M2" | "M3";
type Status = "draft" | "published";

const MOCK_STUDENT = {
  id: "student-1",
  name: "Student Voorbeeld",
};

// Later vervang je dit door echte user/auth
const MOCK_TEACHER = {
  id: "teacher-1",
  name: "Docent Voorbeeld",
};

/**
 * Student scores (mock)
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

  if (value <= 2) return "#c0392b"; // rood
  if (value <= 7) return "#e67e22"; // oranje
  return "#27ae60"; // groen
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

type TeacherItem = {
  score: number | null;
  feedback: string;
  status: Status;
  updatedAt: number;
  publishedAt?: number;
};

type TeacherStore = Record<string, TeacherItem>;

const STORAGE_KEY = "synergos_teacher_review_v1";

/** Unieke key per student+docent+meetmoment+thema+vraag */
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

function badge(status: Status) {
  return (
    <span
      style={{
        display: "inline-block",
        fontSize: 12,
        padding: "2px 8px",
        borderRadius: 999,
        background: status === "published" ? "#e8f8ef" : "#f2f2f2",
        color: status === "published" ? "#1e7f4f" : "#444",
        border: "1px solid #ddd",
      }}
    >
      {status === "published" ? "Gepubliceerd" : "Concept"}
    </span>
  );
}

export default function DocentPage() {
  const [openTheme, setOpenTheme] = useState<string | null>(null);

  // Store per item (per moment/per vraag)
  const [teacherStore, setTeacherStore] = useState<TeacherStore>({});

  // load from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as TeacherStore;
      setTeacherStore(parsed ?? {});
    } catch {
      // ignore corrupt storage
    }
  }, []);

  function persist(next: TeacherStore) {
    setTeacherStore(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // storage full / blocked: ignore
    }
  }

  function getStudentScore(moment: Moment, themeId: string, questionId: string) {
    const key = `${moment}-${themeId}-${questionId}`;
    return MOCK_SCORES[key] ?? null;
  }

  function themeAverage(themeId: string, moment: Moment) {
    const scores = rubric1VO.themes
      .find((t) => t.id === themeId)!
      .questions.map((q) => getStudentScore(moment, themeId, q.id))
      .filter((v): v is number => v !== null);

    if (!scores.length) return null;
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }

  const moments: Moment[] = useMemo(() => ["M1", "M2", "M3"], []);

  function getTeacherItem(args: {
    moment: Moment;
    themeId: string;
    questionId: string;
  }): TeacherItem {
    const key = makeKey({
      studentId: MOCK_STUDENT.id,
      teacherId: MOCK_TEACHER.id,
      moment: args.moment,
      themeId: args.themeId,
      questionId: args.questionId,
    });

    return (
      teacherStore[key] ?? {
        score: null,
        feedback: "",
        status: "draft",
        updatedAt: Date.now(),
      }
    );
  }

  function upsertTeacherItem(args: {
    moment: Moment;
    themeId: string;
    questionId: string;
    patch: Partial<TeacherItem>;
  }) {
    const key = makeKey({
      studentId: MOCK_STUDENT.id,
      teacherId: MOCK_TEACHER.id,
      moment: args.moment,
      themeId: args.themeId,
      questionId: args.questionId,
    });

    const prev = teacherStore[key] ?? {
      score: null,
      feedback: "",
      status: "draft" as Status,
      updatedAt: Date.now(),
    };

    const nextItem: TeacherItem = {
      ...prev,
      ...args.patch,
      // elke wijziging is in principe concept, tenzij expliciet published wordt gezet
      status:
        args.patch.status ??
        (prev.status === "published" ? "published" : "draft"),
      updatedAt: Date.now(),
    };

    persist({ ...teacherStore, [key]: nextItem });
  }

  function saveDrafts() {
    // In deze mock variant is alles al “persisted” zodra je typt.
    // Maar we houden deze knop omdat je straks deze action naar API wilt sturen.
    alert("Concept opgeslagen (localStorage).");
  }

  function publishMoment(moment: Moment) {
    const now = Date.now();
    const next: TeacherStore = { ...teacherStore };

    // publiceer ALLES binnen deze student+docent+moment (alle thema's, alle vragen)
    Object.keys(next).forEach((k) => {
      const parts = k.split("__");
      const studentId = parts[0];
      const teacherId = parts[1];
      const m = parts[2] as Moment;

      if (
        studentId === MOCK_STUDENT.id &&
        teacherId === MOCK_TEACHER.id &&
        m === moment
      ) {
        next[k] = {
          ...next[k],
          status: "published",
          publishedAt: next[k].publishedAt ?? now,
          updatedAt: now,
        };
      }
    });

    persist(next);
    alert(`${moment} is nu zichtbaar voor student (gepubliceerd).`);
  }

  return (
    <div style={{ padding: 32, maxWidth: 1100, margin: "0 auto" }}>
      <h1>Docentoverzicht – 1VO Vakopleiding</h1>

      <div style={{ marginBottom: 16 }}>
        <strong>Student:</strong> {MOCK_STUDENT.name}
        <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
          Ingelogd als: {MOCK_TEACHER.name}
        </div>
      </div>

      {/* ACTIEBALK */}
      <div
        style={{
          display: "flex",
          gap: 10,
          alignItems: "center",
          padding: 12,
          border: "1px solid #eee",
          borderRadius: 10,
          marginBottom: 20,
          background: "#fafafa",
        }}
      >
        <button
          onClick={saveDrafts}
          style={{
            padding: "10px 14px",
            background: "#111",
            color: "#fff",
            border: "none",
            borderRadius: 8,
          }}
        >
          Opslaan (concept)
        </button>

        <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
          {moments.map((m) => (
            <button
              key={m}
              onClick={() => publishMoment(m)}
              style={{
                padding: "10px 14px",
                background: "#fff",
                color: "#111",
                border: "1px solid #ddd",
                borderRadius: 8,
              }}
              title="Maakt alle docent-correcties en feedback in dit meetmoment zichtbaar voor de student"
            >
              Publiceer {m}
            </button>
          ))}
        </div>
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
            onClick={() => setOpenTheme(openTheme === theme.id ? null : theme.id)}
            style={{
              padding: 16,
              background: "#f3f3f3",
              cursor: "pointer",
              fontWeight: 600,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>{theme.title}</span>
            <span style={{ fontSize: 12, color: "#666" }}>
              Klik om te {openTheme === theme.id ? "sluiten" : "openen"}
            </span>
          </div>

          {openTheme === theme.id && (
            <div style={{ padding: 16 }}>
              {/* THEMA GEMIDDELDE */}
              <div style={{ marginBottom: 16 }}>
                <strong>Thema – voortgang (student)</strong>
                {moments.map((m) => (
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

                  {moments.map((m) => {
                    const studentScore = getStudentScore(m, theme.id, q.id);
                    const item = getTeacherItem({
                      moment: m,
                      themeId: theme.id,
                      questionId: q.id,
                    });

                    return (
                      <div
                        key={m}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "130px 1fr 1fr",
                          gap: 12,
                          alignItems: "start",
                          padding: "10px 0",
                          borderTop: "1px dashed #eee",
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 12, color: "#666" }}>{m}</div>
                          <div style={{ marginTop: 4 }}>
                            <div style={{ fontSize: 12, color: "#666" }}>
                              Student
                            </div>
                            <ProgressBar value={studentScore} />
                          </div>
                        </div>

                        {/* DOCENT CORRECTIE */}
                        <div>
                          <div
                            style={{
                              display: "flex",
                              gap: 8,
                              alignItems: "center",
                              marginBottom: 6,
                            }}
                          >
                            <div style={{ fontSize: 12, color: "#666" }}>
                              Docent correctie
                            </div>
                            {badge(item.status)}
                          </div>

                          <div style={{ display: "flex", gap: 10 }}>
                            <input
                              type="number"
                              min={0}
                              max={10}
                              step={1}
                              value={item.score ?? ""}
                              onChange={(e) => {
                                const raw = e.target.value;
                                const val =
                                  raw.trim() === "" ? null : Number(raw);
                                upsertTeacherItem({
                                  moment: m,
                                  themeId: theme.id,
                                  questionId: q.id,
                                  patch: {
                                    score:
                                      val === null || Number.isNaN(val)
                                        ? null
                                        : Math.max(0, Math.min(10, val)),
                                    status: "draft",
                                  },
                                });
                              }}
                              placeholder="0–10"
                              style={{
                                width: 90,
                                padding: "8px 10px",
                                border: "1px solid #ddd",
                                borderRadius: 8,
                              }}
                            />
                            <div style={{ alignSelf: "center" }}>
                              <ProgressBar value={item.score} />
                            </div>
                          </div>
                        </div>

                        {/* DOCENT FEEDBACK */}
                        <div>
                          <div style={{ fontSize: 12, color: "#666" }}>
                            Docent feedback
                          </div>
                          <textarea
                            placeholder="Feedback op deze vraag (concept)…"
                            value={item.feedback}
                            onChange={(e) =>
                              upsertTeacherItem({
                                moment: m,
                                themeId: theme.id,
                                questionId: q.id,
                                patch: { feedback: e.target.value, status: "draft" },
                              })
                            }
                            style={{
                              width: "100%",
                              minHeight: 60,
                              padding: 8,
                              marginTop: 6,
                              border: "1px solid #ddd",
                              borderRadius: 8,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
