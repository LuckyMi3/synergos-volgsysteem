"use client";

import { useEffect, useMemo, useState } from "react";
import { rubric1VO } from "@/lib/rubrics/1vo";

type Moment = "M1" | "M2" | "M3";

const ACTIVE_STUDENT_ID = "cmlqjz0vg0006geb8ucgsfxid";
const ACTIVE_RUBRIC_KEY = "1vo";

type PublishedTeacherReview = {
  id: string;
  assessmentId: string;
  teacherId: string;
  correctedScore: number | null;
  feedback: string | null;
  status: "PUBLISHED";
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

function scoreLabel(value: number) {
  const labels = rubric1VO.scale.labels;
  if (value <= 2) return labels[0];
  if (value <= 7) return labels[5];
  return labels[10];
}

function scoreColor(value: number) {
  if (value <= 2) return "#c0392b";
  if (value <= 7) return "#e67e22";
  return "#27ae60";
}

function teacherScoreLabel(value: number | null) {
  if (value === null) return "–";
  return `${scoreLabel(value)} (${value})`;
}

function teacherScoreColor(value: number | null) {
  if (value === null) return "#999";
  return scoreColor(value);
}

export default function Page() {
  const moments: Moment[] = useMemo(() => ["M1", "M2", "M3"], []);

  const [moment, setMoment] = useState<Moment>("M1");
  const [openTheme, setOpenTheme] = useState<string | null>(null);

  // scores per UI-key: `${moment}-${themeId}-${questionId}`
  const [scores, setScores] = useState<Record<string, number>>({});

  // statusmeldingen
  const [dbStatus, setDbStatus] = useState<string | null>(null);

  // ensured assessmentId voor huidig moment
  const [assessmentId, setAssessmentId] = useState<string | null>(null);

  // published docent review (1x per assessment/moment)
  const [publishedReview, setPublishedReview] =
    useState<PublishedTeacherReview | null>(null);

  // feedback open/closed (1x)
  const [reviewOpen, setReviewOpen] = useState(false);

  function setScore(key: string, value: number) {
    setScores((prev) => ({ ...prev, [key]: value }));
  }

  useEffect(() => {
    let cancelled = false;

    async function ensureAndLoad() {
      setDbStatus(null);
      setAssessmentId(null);
      setPublishedReview(null);
      setReviewOpen(false);

      try {
        // 1) ensure assessment
        const ensureRes = await fetch("/api/assessments/ensure", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            studentId: ACTIVE_STUDENT_ID,
            moment,
            rubricKey: ACTIVE_RUBRIC_KEY,
          }),
        });

        if (!ensureRes.ok) {
          setDbStatus(`Assessment ensure faalde (${ensureRes.status}).`);
          return;
        }

        const ensured = await ensureRes.json();
        const ensuredId = ensured?.id as string | undefined;

        if (!ensuredId) {
          setDbStatus("Assessment ensure gaf geen id terug.");
          return;
        }

        if (cancelled) return;
        setAssessmentId(ensuredId);

        // 2) load scores
        const res = await fetch(
          `/api/scores?assessmentId=${encodeURIComponent(ensuredId)}`
        );
        if (!res.ok) {
          setDbStatus(`Scores laden faalde (${res.status}).`);
          return;
        }

        const rows: Array<{ themeId: string; questionId: string; score: number }> =
          await res.json();

        if (cancelled) return;

        setScores(() => {
          const next: Record<string, number> = {};
          for (const r of rows) {
            const k = `${moment}-${r.themeId}-${r.questionId}`;
            next[k] = r.score;
          }
          return next;
        });

        // 3) load published teacher review (student ziet alleen PUBLISHED)
        const reviewRes = await fetch(
          `/api/teacher-reviews/published?assessmentId=${encodeURIComponent(
            ensuredId
          )}`
        );

        if (reviewRes.ok) {
          const review = (await reviewRes.json()) as PublishedTeacherReview | null;
          if (!cancelled) setPublishedReview(review);
        }

        setDbStatus(`Assessment ensured + scores geladen voor ${moment}.`);
      } catch {
        if (!cancelled) setDbStatus("Ensure/laden faalde (netwerk/exception).");
      }
    }

    ensureAndLoad();
    return () => {
      cancelled = true;
    };
  }, [moment]);

  async function refreshPublishedReview() {
    if (!assessmentId) return;
    try {
      const r = await fetch(
        `/api/teacher-reviews/published?assessmentId=${encodeURIComponent(
          assessmentId
        )}`
      );
      if (r.ok) {
        const review = (await r.json()) as PublishedTeacherReview | null;
        setPublishedReview(review);
      }
    } catch {
      // best-effort
    }
  }

  async function saveScoreToDb(args: {
    themeId: string;
    questionId: string;
    value: number;
  }) {
    if (!assessmentId) {
      setDbStatus(`Kan niet opslaan: assessmentId ontbreekt (${moment}).`);
      return;
    }

    try {
      const res = await fetch("/api/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assessmentId,
          themeId: args.themeId,
          questionId: args.questionId,
          score: args.value,
          comment: null,
        }),
      });

      if (!res.ok) {
        setDbStatus(`Opslaan faalde (${res.status}).`);
        return;
      }

      setDbStatus(`Opgeslagen in database (${moment}).`);
    } catch {
      setDbStatus("Opslaan faalde (netwerk/exception).");
    }
  }

  return (
    <div style={{ padding: 32, maxWidth: 900, margin: "0 auto" }}>
      <h1>1VO - Vakopleiding Haptonomie</h1>

      <div style={{ marginBottom: 16 }}>
        <strong>Student:</strong> Student Voorbeeld
      </div>

      {/* Meetmoment + refresh */}
      <div style={{ marginBottom: 24, display: "flex", alignItems: "center", gap: 10 }}>
        <div>
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
                cursor: "pointer",
              }}
            >
              {m}
            </button>
          ))}
        </div>

        <button
          onClick={refreshPublishedReview}
          style={{
            marginLeft: "auto",
            padding: "8px 12px",
            background: "#fff",
            color: "#111",
            border: "1px solid #ddd",
            borderRadius: 8,
            cursor: "pointer",
          }}
          title="Herlaadt gepubliceerde docentfeedback (handig bij testen met twee tabbladen)"
        >
          Ververs docentfeedback
        </button>
      </div>

      {/* DB status */}
      <div style={{ marginBottom: 16, fontSize: 12, color: "#666" }}>
        <div>
          <strong>AssessmentId ({moment}):</strong>{" "}
          <span style={{ fontFamily: "monospace" }}>
            {assessmentId ?? "— (aanmaken/laden...)"}
          </span>
        </div>
        {dbStatus ? <div style={{ marginTop: 6 }}>{dbStatus}</div> : null}
      </div>

      {/* ✅ Docentreview 1x per meetmoment */}
      <div style={{ marginBottom: 18 }}>
        <div
          style={{
            padding: 14,
            border: "1px solid #eee",
            borderRadius: 12,
            background: "#fafafa",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ fontWeight: 700 }}>Docent terugkoppeling ({moment})</div>
            <div style={{ marginLeft: "auto", fontSize: 12, color: "#666" }}>
              {publishedReview ? "gepubliceerd" : "nog niet gepubliceerd"}
            </div>
          </div>

          {publishedReview ? (
            <>
              <div style={{ fontSize: 13, marginTop: 10 }}>
                Docent correctie (overall):{" "}
                <span
                  style={{
                    color: teacherScoreColor(publishedReview.correctedScore),
                    fontWeight: 600,
                  }}
                >
                  {teacherScoreLabel(publishedReview.correctedScore)}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setReviewOpen((v) => !v)}
                style={{
                  marginTop: 10,
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
                {reviewOpen ? "▾" : "▸"} Docent feedback
                {publishedReview.feedback?.trim() ? (
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

              {reviewOpen && (
                <div style={{ marginTop: 10 }}>
                  {publishedReview.feedback?.trim() ? (
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
                      {publishedReview.feedback}
                    </div>
                  ) : (
                    <div style={{ fontSize: 13, color: "#666", marginTop: 6 }}>
                      Er is geen tekstfeedback gepubliceerd.
                    </div>
                  )}

                  {publishedReview.publishedAt ? (
                    <div style={{ fontSize: 12, color: "#666", marginTop: 8 }}>
                      Gepubliceerd op{" "}
                      {new Date(publishedReview.publishedAt).toLocaleString("nl-NL")} door{" "}
                      {publishedReview.teacherId}
                    </div>
                  ) : null}
                </div>
              )}
            </>
          ) : (
            <div style={{ fontSize: 13, color: "#666", marginTop: 8 }}>
              Er is nog geen gepubliceerde docentreview voor dit meetmoment.
            </div>
          )}
        </div>
      </div>

      {/* Thema's (zonder docentblok per vraag) */}
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
                    <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 10 }}>
                      Jouw huidige inschatting:{" "}
                      <span style={{ color: scoreColor(value) }}>{scoreLabel(value)}</span>
                    </div>

                    {/* Slider */}
                    <input
                      type="range"
                      min={rubric1VO.scale.min}
                      max={rubric1VO.scale.max}
                      value={value}
                      onChange={(e) => {
                        const newValue = Number(e.target.value);
                        setScore(key, newValue);

                        saveScoreToDb({
                          themeId: theme.id,
                          questionId: q.id,
                          value: newValue,
                        });
                      }}
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
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
