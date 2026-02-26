"use client";

import { useEffect, useMemo, useState } from "react";
import { getRubric } from "@/lib/rubrics";

type Moment = "M1" | "M2" | "M3";

type MeEnrollment = {
  id: string;
  createdAt: string;
  cohort: {
    id: string;
    naam: string;
    traject: string | null;
    uitvoeringId: string;
    createdAt: string;
  };
};

type MeUser = {
  id: string;
  role: string;
  name?: string;
  voornaam?: string;
  tussenvoegsel?: string | null;
  achternaam?: string;
  email?: string | null;
  enrollments?: MeEnrollment[];
};

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

function clamp(n: number, min: number, max: number) {
  if (n < min) return min;
  if (n > max) return max;
  return n;
}

/**
 * Ondersteunt:
 * - labels als array (index = value - min)
 * - labels als object (bijv. {0:"..",5:"..",10:".."} → kiest dichtstbijzijnde <= value)
 */
function labelForValue(rubric: any, value: number) {
  const min = Number(rubric?.scale?.min ?? 0);
  const max = Number(rubric?.scale?.max ?? 10);
  const v = clamp(value, min, max);

  const labels = rubric?.scale?.labels;

  if (Array.isArray(labels)) {
    const idx = v - min;
    return labels[idx] ?? String(v);
  }

  if (labels && typeof labels === "object") {
    const keys = Object.keys(labels)
      .map((k) => Number(k))
      .filter((k) => Number.isFinite(k))
      .sort((a, b) => a - b);

    if (keys.length === 0) return String(v);
    if ((labels as any)[v] != null) return String((labels as any)[v]);

    // grootste key <= v
    let chosen = keys[0];
    for (const k of keys) {
      if (k <= v) chosen = k;
      else break;
    }
    return String((labels as any)[chosen] ?? v);
  }

  return String(v);
}

function colorForValue(rubric: any, value: number) {
  const min = Number(rubric?.scale?.min ?? 0);
  const max = Number(rubric?.scale?.max ?? 10);
  const v = clamp(value, min, max);
  const ratio = max === min ? 1 : (v - min) / (max - min);

  if (ratio <= 0.3) return "#c0392b";
  if (ratio <= 0.7) return "#e67e22";
  return "#27ae60";
}

function defaultValueForRubric(rubric: any) {
  const min = Number(rubric?.scale?.min ?? 0);
  const max = Number(rubric?.scale?.max ?? 10);
  return Math.round((min + max) / 2);
}

function teacherScoreLabel(rubric: any, value: number | null) {
  if (value === null) return "–";
  return `${labelForValue(rubric, value)} (${value})`;
}

function teacherScoreColor(rubric: any, value: number | null) {
  if (value === null) return "#999";
  return colorForValue(rubric, value);
}

function displayNameFromMe(me: MeUser | null) {
  if (!me) return "—";
  if (me.name && me.name.trim()) return me.name.trim();
  const parts = [me.voornaam, me.tussenvoegsel, me.achternaam].filter(Boolean);
  return parts.join(" ").trim() || me.email || me.id;
}

export default function VolgsysteemClient() {
  const moments: Moment[] = useMemo(() => ["M1", "M2", "M3"], []);

  const [moment, setMoment] = useState<Moment>("M1");
  const [openTheme, setOpenTheme] = useState<string | null>(null);

  // ✅ effectieve user (impersonated of echte login)
  const [me, setMe] = useState<MeUser | null>(null);
  const studentId = me?.id ?? "";

  // ✅ cohort/rubricKey uit nieuwste enrollment
  const activeEnrollment = me?.enrollments?.[0] ?? null;
  const rubricKey = (activeEnrollment?.cohort?.traject || "1vo").toLowerCase().trim();
  const rubric = useMemo(() => getRubric(rubricKey), [rubricKey]);
  const cohortNaam = activeEnrollment?.cohort?.naam ?? null;

  // scores per UI-key: `${moment}-${themeId}-${questionId}`
  const [scores, setScores] = useState<Record<string, number>>({});

  // statusmeldingen
  const [dbStatus, setDbStatus] = useState<string | null>(null);

  // ensured assessmentId voor huidig moment
  const [assessmentId, setAssessmentId] = useState<string | null>(null);

  // submittedAt (lock per assessment)
  const [submittedAt, setSubmittedAt] = useState<string | null>(null);
  const isSubmitted = Boolean(submittedAt);

  // published docent review (1x per assessment/moment)
  const [publishedReview, setPublishedReview] =
    useState<PublishedTeacherReview | null>(null);

  // feedback open/closed (1x)
  const [reviewOpen, setReviewOpen] = useState(false);

  function setScore(key: string, value: number) {
    setScores((prev) => ({ ...prev, [key]: value }));
  }

  async function loadAssessmentMeta(id: string) {
    try {
      const r = await fetch(`/api/assessments/${encodeURIComponent(id)}`);
      const j = await r.json().catch(() => ({}));
      if (r.ok && j?.ok && j?.assessment) {
        setSubmittedAt(j.assessment.submittedAt ?? null);
      } else {
        setSubmittedAt(null);
      }
    } catch {
      setSubmittedAt(null);
    }
  }

  // ✅ load effective user once
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
          setDbStatus("Geen ingelogde/impersonated student gevonden.");
        }
      } catch {
        if (!cancelled) setDbStatus("User laden faalde (netwerk/exception).");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function ensureAndLoad() {
      setDbStatus(null);
      setAssessmentId(null);
      setSubmittedAt(null);
      setPublishedReview(null);
      setReviewOpen(false);

      if (!studentId) {
        setDbStatus("Student laden...");
        return;
      }

      try {
        // 1) ensure assessment (voor ingelogde/impersonated student)
        const ensureRes = await fetch("/api/assessments/ensure", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            studentId,
            moment,
            rubricKey, // ✅ dynamisch
          }),
        });

        const ensureJson = await ensureRes.json().catch(() => ({}));

        if (!ensureRes.ok) {
          setDbStatus(
            `Assessment ensure faalde (${ensureRes.status}): ${ensureJson?.error ?? "onbekend"}`
          );
          return;
        }

        const ensuredId = ensureJson?.id as string | undefined;

        if (!ensuredId) {
          setDbStatus("Assessment ensure gaf geen id terug.");
          return;
        }

        if (cancelled) return;
        setAssessmentId(ensuredId);

        // 1b) load submittedAt/meta (lock per assessment)
        await loadAssessmentMeta(ensuredId);
        if (cancelled) return;

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
          `/api/teacher-reviews/published?assessmentId=${encodeURIComponent(ensuredId)}`
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
  }, [moment, studentId, rubricKey]);

  async function refreshPublishedReview() {
    if (!assessmentId) return;
    try {
      const r = await fetch(
        `/api/teacher-reviews/published?assessmentId=${encodeURIComponent(assessmentId)}`
      );
      if (r.ok) {
        const review = (await r.json()) as PublishedTeacherReview | null;
        setPublishedReview(review);
      }
    } catch {
      // best-effort
    }
  }

  async function submitAssessment() {
    if (!assessmentId) return;

    const ok = confirm(
      `Weet je zeker dat je ${moment} wilt inleveren?\n\nNa inleveren kun je je eigen scores niet meer aanpassen. (Admin kan dit wel herstellen als het per ongeluk was.)`
    );
    if (!ok) return;

    try {
      setDbStatus("Inleveren...");
      const res = await fetch(
        `/api/assessments/${encodeURIComponent(assessmentId)}/submit`,
        { method: "POST" }
      );
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j?.ok) {
        setDbStatus(`Inleveren faalde (${res.status}).`);
        return;
      }

      setSubmittedAt(j.assessment?.submittedAt ?? new Date().toISOString());
      setDbStatus(`Ingeleverd (${moment}).`);
    } catch {
      setDbStatus("Inleveren faalde (netwerk/exception).");
    }
  }

  async function saveScoreToDb(args: { themeId: string; questionId: string; value: number }) {
    if (isSubmitted) {
      setDbStatus("Dit meetmoment is ingeleverd; je kunt niet meer wijzigen.");
      return;
    }

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

  const minLabel = labelForValue(rubric, Number(rubric?.scale?.min ?? 0));
  const midLabel = labelForValue(rubric, defaultValueForRubric(rubric));
  const maxLabel = labelForValue(rubric, Number(rubric?.scale?.max ?? 10));

  return (
    <div style={{ maxWidth: 900 }}>
      <h1>{cohortNaam ? cohortNaam : rubric.title}</h1>

      <div style={{ marginBottom: 10, fontSize: 12, color: "#666" }}>
        <div>
          <strong>Rubric:</strong>{" "}
          <span style={{ fontFamily: "monospace" }}>{rubricKey}</span>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <strong>Student:</strong> {displayNameFromMe(me)}
      </div>

      {/* Meetmoment + acties */}
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
              title={isSubmitted ? "Let op: dit meetmoment is ingeleverd (readonly)." : undefined}
            >
              {m}
            </button>
          ))}
        </div>

        {/* Inleveren */}
        <button
          onClick={submitAssessment}
          disabled={!assessmentId || isSubmitted}
          style={{
            marginLeft: 12,
            padding: "8px 12px",
            background: isSubmitted ? "#f5f5f5" : "#111",
            color: isSubmitted ? "#666" : "#fff",
            border: isSubmitted ? "1px solid #ddd" : "1px solid #111",
            borderRadius: 8,
            cursor: !assessmentId || isSubmitted ? "not-allowed" : "pointer",
            opacity: !assessmentId || isSubmitted ? 0.7 : 1,
          }}
          title={
            isSubmitted
              ? "Dit meetmoment is al ingeleverd."
              : "Lever dit meetmoment in (je eigen scores worden readonly)."
          }
        >
          Inleveren
        </button>

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

      {/* Status/readonly banner */}
      <div style={{ marginBottom: 16, fontSize: 12, color: "#666" }}>
        <div>
          <strong>AssessmentId ({moment}):</strong>{" "}
          <span style={{ fontFamily: "monospace" }}>
            {assessmentId ?? "— (aanmaken/laden...)"}
          </span>
        </div>

        <div style={{ marginTop: 6 }}>
          <strong>Status:</strong>{" "}
          {isSubmitted ? (
            <span>
              ingeleverd op{" "}
              <span style={{ fontFamily: "monospace" }}>
                {new Date(submittedAt!).toLocaleString("nl-NL")}
              </span>{" "}
              (readonly)
            </span>
          ) : (
            <span>open (je kunt wijzigen)</span>
          )}
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
                    color: teacherScoreColor(rubric, publishedReview.correctedScore),
                    fontWeight: 600,
                  }}
                >
                  {teacherScoreLabel(rubric, publishedReview.correctedScore)}
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

      {/* Thema's */}
      {rubric.themes.map((theme: any) => (
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
              {theme.questions.map((q: any) => {
                const key = `${moment}-${theme.id}-${q.id}`;
                const value = scores[key] ?? defaultValueForRubric(rubric);

                return (
                  <div
                    key={key}
                    style={{
                      marginBottom: 28,
                      paddingBottom: 16,
                      borderBottom: "1px solid #eee",
                    }}
                  >
                    <div style={{ marginBottom: 6, fontWeight: 600 }}>{q.text}</div>

                    <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 10 }}>
                      Jouw huidige inschatting:{" "}
                      <span style={{ color: colorForValue(rubric, value) }}>
                        {labelForValue(rubric, value)}
                      </span>
                      {isSubmitted ? (
                        <span style={{ marginLeft: 10, fontSize: 12, color: "#666" }}>
                          (readonly na inleveren)
                        </span>
                      ) : null}
                    </div>

                    <input
                      type="range"
                      min={rubric.scale.min}
                      max={rubric.scale.max}
                      value={value}
                      disabled={isSubmitted}
                      onChange={(e) => {
                        if (isSubmitted) return;
                        const newValue = Number(e.target.value);
                        setScore(key, newValue);

                        saveScoreToDb({
                          themeId: theme.id,
                          questionId: q.id,
                          value: newValue,
                        });
                      }}
                      style={{
                        width: "100%",
                        opacity: isSubmitted ? 0.6 : 1,
                        cursor: isSubmitted ? "not-allowed" : "pointer",
                      }}
                    />

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: 12,
                        marginTop: 6,
                      }}
                    >
                      <span style={{ color: "#c0392b" }}>{minLabel}</span>
                      <span style={{ color: "#e67e22" }}>{midLabel}</span>
                      <span style={{ color: "#27ae60" }}>{maxLabel}</span>
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