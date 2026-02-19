"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { rubric1VO } from "@/lib/rubrics/1vo";

type Moment = "M1" | "M2" | "M3";

type Student = {
  id: string;
  name: string;
};

type Cohort = {
  id: string;
  title: string;
  rubricKey: string;
  year: number;
  createdAt: string;
};

type ScoreRow = {
  id: string;
  assessmentId: string;
  themeId: string;
  questionId: string;
  score: number;
  comment: string | null;
  updatedAt: string;
};

type ReviewStatus = "DRAFT" | "PUBLISHED";

type TeacherReview = {
  id: string;
  assessmentId: string;
  teacherId: string;
  correctedScore: number | null; // blijft bestaan, maar is "overall" (optioneel)
  feedback: string | null; // algemene feedback (optioneel)
  status: ReviewStatus;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type TeacherScoreRow = {
  id: string;
  assessmentId: string;
  teacherId: string;
  themeId: string;
  questionId: string;
  correctedScore: number | null;
  feedback: string | null;
  createdAt: string;
  updatedAt: string;
};

type SaveState = "idle" | "saving" | "saved" | "error";

const ACTIVE_RUBRIC_KEY = "1vo";

// v1: nog geen auth → teacherId hardcoded (later uit portal context)
const TEACHER_ID = "docent-1";

function badgeStyle(status: ReviewStatus | "NONE") {
  if (status === "PUBLISHED")
    return { background: "#111", color: "#fff", border: "1px solid #111" };
  if (status === "DRAFT")
    return {
      background: "#fff7e6",
      color: "#8a4b00",
      border: "1px solid #ffd8a8",
    };
  return { background: "#f3f4f6", color: "#374151", border: "1px solid #e5e7eb" };
}

function clampToScale(n: number) {
  const min = rubric1VO.scale.min;
  const max = rubric1VO.scale.max;
  if (n < min) return min;
  if (n > max) return max;
  return n;
}

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

function k(themeId: string, questionId: string) {
  return `${themeId}__${questionId}`;
}

export default function DocentPage() {
  const moments: Moment[] = useMemo(() => ["M1", "M2", "M3"], []);
  const [moment, setMoment] = useState<Moment>("M1");

  // cohorts for this teacher
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [selectedCohortId, setSelectedCohortId] = useState<string>("");

  // students filtered by cohort + teacher
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");

  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  const [scoreMap, setScoreMap] = useState<Record<string, number>>({});
  const [status, setStatus] = useState<string | null>(null);

  // TeacherReview = publish gate + optional overall feedback
  const [review, setReview] = useState<TeacherReview | null>(null);
  const [overallFeedback, setOverallFeedback] = useState<string>("");
  const [reviewMsg, setReviewMsg] = useState<string>("");
  const [busy, setBusy] = useState<boolean>(false);

  // ✅ Teacher scores per vraag
  const [teacherScoreMap, setTeacherScoreMap] = useState<
    Record<string, { correctedScore: number | null; feedback: string }>
  >({});
  const [rowSaveState, setRowSaveState] = useState<Record<string, SaveState>>({});
  const [openRow, setOpenRow] = useState<Record<string, boolean>>({});

  // debounce timers per row
  const saveTimersRef = useRef<Record<string, any>>({});

  const selectedStudent = students.find((s) => s.id === selectedStudentId) || null;
  const selectedCohort = cohorts.find((c) => c.id === selectedCohortId) || null;

  function setRowState(key: string, state: SaveState) {
    setRowSaveState((prev) => ({ ...prev, [key]: state }));
  }

  function toggleRow(key: string) {
    setOpenRow((prev) => ({ ...prev, [key]: !(prev[key] ?? false) }));
  }

  async function loadTeacherReview(forAssessmentId: string) {
    setReviewMsg("");
    const res = await fetch(
      `/api/teacher-reviews?assessmentId=${encodeURIComponent(forAssessmentId)}`
    );

    if (!res.ok) {
      setReview(null);
      setOverallFeedback("");
      setReviewMsg(`Review laden faalde (${res.status}).`);
      return;
    }

    const data = (await res.json()) as TeacherReview | null;
    setReview(data);
    setOverallFeedback(data?.feedback ?? "");
    setReviewMsg(data ? `Review geladen (${data.status}).` : "Nog geen review (maak draft).");
  }

  async function loadTeacherScores(forAssessmentId: string) {
    // reset states
    setTeacherScoreMap({});
    setRowSaveState({});

    try {
      const res = await fetch(
        `/api/teacher-scores?assessmentId=${encodeURIComponent(
          forAssessmentId
        )}&teacherId=${encodeURIComponent(TEACHER_ID)}`
      );

      if (!res.ok) {
        // route mist of error: laat UI werken, maar markeer later per save
        return;
      }

      const rows = (await res.json()) as TeacherScoreRow[];

      const next: Record<string, { correctedScore: number | null; feedback: string }> = {};
      for (const r of rows) {
        next[k(r.themeId, r.questionId)] = {
          correctedScore: r.correctedScore ?? null,
          feedback: r.feedback ?? "",
        };
      }
      setTeacherScoreMap(next);
    } catch {
      // ignore: UI blijft werken
    }
  }

  function scheduleSaveTeacherScore(args: {
    themeId: string;
    questionId: string;
    correctedScore: number | null;
    feedback: string;
  }) {
    if (!assessmentId) return;

    const rowKey = k(args.themeId, args.questionId);

    // update UI state first
    setTeacherScoreMap((prev) => ({
      ...prev,
      [rowKey]: { correctedScore: args.correctedScore, feedback: args.feedback },
    }));

    // set saving state
    setRowState(rowKey, "saving");

    // clear previous timer
    if (saveTimersRef.current[rowKey]) {
      clearTimeout(saveTimersRef.current[rowKey]);
    }

    // debounce
    saveTimersRef.current[rowKey] = setTimeout(async () => {
      try {
        const res = await fetch("/api/teacher-scores", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            assessmentId,
            teacherId: TEACHER_ID,
            themeId: args.themeId,
            questionId: args.questionId,
            correctedScore: args.correctedScore,
            feedback: args.feedback.trim() ? args.feedback : null,
          }),
        });

        if (!res.ok) {
          setRowState(rowKey, "error");
          return;
        }

        setRowState(rowKey, "saved");
        // after short while, go idle
        setTimeout(() => {
          setRowSaveState((prev) => (prev[rowKey] === "saved" ? { ...prev, [rowKey]: "idle" } : prev));
        }, 900);
      } catch {
        setRowState(rowKey, "error");
      }
    }, 300);
  }

  // 1) load cohorts for this teacher
  useEffect(() => {
    let cancelled = false;

    async function loadCohorts() {
      setStatus("Cohorts laden...");
      try {
        const res = await fetch(`/api/teachers/${encodeURIComponent(TEACHER_ID)}/cohorts`);
        if (!res.ok) {
          setStatus(`Cohorts laden faalde (${res.status}).`);
          return;
        }
        const data: Cohort[] = await res.json();
        if (cancelled) return;

        setCohorts(data);
        if (!selectedCohortId && data.length > 0) {
          setSelectedCohortId(data[0].id);
        }
        setStatus(null);
      } catch {
        if (!cancelled) setStatus("Cohorts laden faalde (netwerk/exception).");
      }
    }

    loadCohorts();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2) load students for selected cohort (filtered by teacher)
  useEffect(() => {
    let cancelled = false;

    async function loadStudentsForCohort() {
      setStudents([]);
      setSelectedStudentId("");
      if (!selectedCohortId) return;

      setStatus("Studenten laden voor cohort...");
      try {
        const res = await fetch(
          `/api/teachers/${encodeURIComponent(TEACHER_ID)}/students?cohortId=${encodeURIComponent(
            selectedCohortId
          )}`
        );

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setStatus(`Studenten laden faalde (${res.status}): ${data?.error ?? "onbekend"}`);
          return;
        }

        const data: Student[] = await res.json();
        if (cancelled) return;

        setStudents(data);
        if (data.length > 0) setSelectedStudentId(data[0].id);
        setStatus(null);
      } catch {
        if (!cancelled) setStatus("Studenten laden faalde (netwerk/exception).");
      }
    }

    loadStudentsForCohort();
    return () => {
      cancelled = true;
    };
  }, [selectedCohortId]);

  // 3) Ensure assessment + load student scores + load review + load teacher scores
  useEffect(() => {
    let cancelled = false;

    async function ensureAndLoadAll() {
      setAssessmentId(null);
      setScoreMap({});
      setReview(null);
      setOverallFeedback("");
      setReviewMsg("");
      setTeacherScoreMap({});
      setRowSaveState({});

      if (!selectedStudentId) {
        setStatus(selectedCohortId ? "Kies een student." : "Kies een cohort.");
        return;
      }

      setStatus("Assessment ophalen + scores laden...");

      try {
        const ensureRes = await fetch("/api/assessments/ensure", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            studentId: selectedStudentId,
            moment,
            rubricKey: ACTIVE_RUBRIC_KEY,
          }),
        });

        if (!ensureRes.ok) {
          setStatus(`Assessment ensure faalde (${ensureRes.status}).`);
          return;
        }

        const ensured = await ensureRes.json();
        const ensuredId = ensured?.id as string | undefined;

        if (!ensuredId) {
          setStatus("Assessment ensure gaf geen id terug.");
          return;
        }

        if (cancelled) return;
        setAssessmentId(ensuredId);

        // student scores (read-only)
        const scoresRes = await fetch(`/api/scores?assessmentId=${encodeURIComponent(ensuredId)}`);
        if (!scoresRes.ok) {
          setStatus(`Scores laden faalde (${scoresRes.status}).`);
          return;
        }

        const rows: ScoreRow[] = await scoresRes.json();
        if (cancelled) return;

        const map: Record<string, number> = {};
        for (const r of rows) {
          map[k(r.themeId, r.questionId)] = r.score;
        }
        setScoreMap(map);

        setStatus(null);

        await loadTeacherReview(ensuredId);
        await loadTeacherScores(ensuredId);
      } catch {
        if (!cancelled) setStatus("Ensure/laden faalde (netwerk/exception).");
      }
    }

    ensureAndLoadAll();
    return () => {
      cancelled = true;
    };
  }, [selectedStudentId, moment, selectedCohortId]);

  function getStudentScore(themeId: string, questionId: string) {
    return scoreMap[k(themeId, questionId)];
  }

  function getTeacherRow(themeId: string, questionId: string) {
    return teacherScoreMap[k(themeId, questionId)] ?? { correctedScore: null, feedback: "" };
  }

  async function saveDraftGate() {
    if (!assessmentId) {
      setReviewMsg("assessmentId ontbreekt.");
      return;
    }

    setBusy(true);
    setReviewMsg("Opslaan als draft...");
    try {
      const res = await fetch("/api/teacher-reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assessmentId,
          teacherId: TEACHER_ID,
          correctedScore: null, // we gebruiken per-vraag scores als fundatie
          feedback: overallFeedback.trim() ? overallFeedback : null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setReviewMsg(`Opslaan faalde (${res.status}): ${data?.error ?? "onbekend"}`);
        return;
      }

      setReview(data);
      setReviewMsg("Draft opgeslagen (student ziet dit nog niet).");
    } catch {
      setReviewMsg("Opslaan faalde (netwerk/exception).");
    } finally {
      setBusy(false);
    }
  }

  async function publishGate() {
    if (!assessmentId) {
      setReviewMsg("assessmentId ontbreekt.");
      return;
    }

    setBusy(true);
    setReviewMsg("Publiceren...");
    try {
      const res = await fetch("/api/teacher-reviews/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assessmentId, teacherId: TEACHER_ID }),
      });

      const data = await res.json();

      if (!res.ok) {
        setReviewMsg(`Publiceren faalde (${res.status}): ${data?.error ?? "onbekend"}`);
        return;
      }

      setReview(data);
      setReviewMsg("Gepubliceerd (student kan dit zien).");
    } catch {
      setReviewMsg("Publiceren faalde (netwerk/exception).");
    } finally {
      setBusy(false);
    }
  }

  function saveBadgeText(state: SaveState | undefined) {
    if (!state || state === "idle") return "";
    if (state === "saving") return "opslaan…";
    if (state === "saved") return "aangepast";
    return "niet opgeslagen";
  }

  function saveBadgeStyle(state: SaveState | undefined) {
  if (!state || state === "idle") return { display: "none" as const };

  if (state === "saving")
    return {
      display: "inline-block",
      padding: "2px 8px",
      borderRadius: 999,
      fontSize: 12,
      border: "1px solid #ddd",
      background: "#fff",
      color: "#666",
      marginLeft: 8,
    };

  if (state === "saved")
    return {
      display: "inline-block",
      padding: "2px 8px",
      borderRadius: 999,
      fontSize: 12,
      border: "1px solid #d1fae5",
      background: "#ecfdf5",
      color: "#065f46",
      marginLeft: 8,
    };

  // niet opgeslagen (neutraal, niet rood)
  return {
    display: "inline-block",
    padding: "2px 8px",
    borderRadius: 999,
    fontSize: 12,
    border: "1px solid #fde68a",
    background: "#fffbeb",
    color: "#92400e",
    marginLeft: 8,
  };
}


  return (
    <main style={{ padding: 32, maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ fontSize: 24, marginBottom: 16 }}>
        Docentweergave – 1VO Ontwikkelvolgsysteem
      </h1>

      {/* status */}
      <div style={{ marginBottom: 16, fontSize: 12, color: "#666" }}>
        <div>
          <strong>Teacher:</strong> {TEACHER_ID}
        </div>
        <div>
          <strong>Cohort:</strong>{" "}
          {selectedCohort ? `${selectedCohort.title} (${selectedCohort.id})` : "—"}
        </div>
        <div>
          <strong>Student:</strong>{" "}
          {selectedStudent ? `${selectedStudent.name} (${selectedStudent.id})` : "—"}
        </div>
        <div>
          <strong>Moment:</strong> {moment}
        </div>
        <div>
          <strong>AssessmentId:</strong>{" "}
          <span style={{ fontFamily: "monospace" }}>{assessmentId ?? "—"}</span>
        </div>
        {status ? <div style={{ marginTop: 6 }}>{status}</div> : null}
      </div>

      {/* Cohort selectie */}
      <div style={{ marginBottom: 14 }}>
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
                {c.title}
              </option>
            ))
          )}
        </select>
      </div>

      {/* Student selectie */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ marginRight: 8 }}>Student:</label>
        <select
          value={selectedStudentId}
          onChange={(e) => setSelectedStudentId(e.target.value)}
          disabled={students.length === 0}
        >
          {students.length === 0 ? (
            <option value="">(geen studenten)</option>
          ) : (
            students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))
          )}
        </select>
      </div>

      {/* Moment selectie */}
      <div style={{ marginBottom: 20 }}>
        {moments.map((m) => (
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

      {/* TeacherReview gate card */}
      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: 12,
          padding: 16,
          marginBottom: 24,
          background: "#fafafa",
          overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <div style={{ fontSize: 16, fontWeight: 800 }}>Publicatie (draft/publish)</div>

          <span
            style={{
              padding: "6px 10px",
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 800,
              ...badgeStyle(review?.status ?? "NONE"),
            }}
          >
            {review?.status ?? "GEEN REVIEW"}
          </span>

          {review?.publishedAt ? (
            <span style={{ fontSize: 12, color: "#666" }}>
              publishedAt: {new Date(review.publishedAt).toLocaleString("nl-NL")}
            </span>
          ) : null}

          <span style={{ marginLeft: "auto", fontSize: 12, color: "#666" }}>{reviewMsg}</span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "260px minmax(0, 1fr)",
            gap: 16,
            alignItems: "start",
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12, color: "#666", marginBottom: 6 }}>teacherId</div>
            <input
              value={TEACHER_ID}
              readOnly
              style={{
                width: "100%",
                padding: 10,
                border: "1px solid #ddd",
                borderRadius: 10,
                boxSizing: "border-box",
                background: "#f6f6f6",
                color: "#444",
              }}
            />
            <div style={{ fontSize: 12, color: "#666", marginTop: 10 }}>
              Publiceren zet álle per-vraag correcties + feedback zichtbaar voor student.
            </div>
          </div>

          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12, color: "#666", marginBottom: 6 }}>
              Algemene feedback (optioneel)
            </div>

            <textarea
              value={overallFeedback}
              onChange={(e) => setOverallFeedback(e.target.value)}
              rows={4}
              disabled={!assessmentId || busy}
              style={{
                width: "100%",
                maxWidth: "100%",
                boxSizing: "border-box",
                padding: 12,
                border: "1px solid #ddd",
                borderRadius: 10,
                resize: "vertical",
                background: "#fff",
                display: "block",
              }}
            />

            <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
              <button
                onClick={saveDraftGate}
                disabled={!assessmentId || busy}
                style={{
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: "1px solid #ddd",
                  background: "#fff",
                  cursor: !assessmentId || busy ? "not-allowed" : "pointer",
                  fontWeight: 700,
                }}
              >
                Opslaan als draft
              </button>

              <button
                onClick={publishGate}
                disabled={!assessmentId || busy || !review}
                style={{
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: "none",
                  background: "#111",
                  color: "#fff",
                  cursor: !assessmentId || busy || !review ? "not-allowed" : "pointer",
                  fontWeight: 800,
                }}
                title={!review ? "Maak eerst een draft aan" : "Publiceer de review"}
              >
                Publish
              </button>

              <button
                type="button"
                onClick={() => assessmentId && loadTeacherReview(assessmentId)}
                disabled={!assessmentId || busy}
                style={{
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: "1px solid #ddd",
                  background: "#fff",
                  cursor: !assessmentId || busy ? "not-allowed" : "pointer",
                  fontWeight: 700,
                }}
              >
                Ververs
              </button>

              <button
                type="button"
                onClick={() => assessmentId && loadTeacherScores(assessmentId)}
                disabled={!assessmentId || busy}
                style={{
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: "1px solid #ddd",
                  background: "#fff",
                  cursor: !assessmentId || busy ? "not-allowed" : "pointer",
                  fontWeight: 700,
                }}
              >
                Ververs per-vraag
              </button>
            </div>

            <div style={{ fontSize: 12, color: "#666", marginTop: 10 }}>
              Let op: “Opslaan als draft” zorgt dat student niets ziet (ook per-vraag niet).
            </div>
          </div>
        </div>
      </div>

      {/* Per theme cards, per vraag docentcorrectie */}
      {rubric1VO.themes.map((theme: any) => (
        <div
          key={theme.id}
          style={{
            border: "1px solid #ddd",
            borderRadius: 12,
            marginBottom: 16,
            overflow: "hidden",
          }}
        >
          <div style={{ padding: 14, background: "#f5f5f5", fontWeight: 800 }}>
            {theme.title}
          </div>

          <div style={{ padding: 14 }}>
            {theme.questions.map((q: any) => {
              const rowKey = k(theme.id, q.id);
              const sScore = getStudentScore(theme.id, q.id);
              const tRow = getTeacherRow(theme.id, q.id);

              const isOpen = openRow[rowKey] ?? false;
              const saveState = rowSaveState[rowKey];

              const studentScoreText =
                typeof sScore === "number" ? `${scoreLabel(sScore)} (${sScore})` : "—";

              const teacherScoreValue = tRow.correctedScore; // number | null
              const teacherScoreText =
                teacherScoreValue === null ? "—" : `${scoreLabel(teacherScoreValue)} (${teacherScoreValue})`;

              return (
                <div
                  key={rowKey}
                  style={{
                    padding: "12px 0",
                    borderBottom: "1px solid #eee",
                  }}
                >
                  <div style={{ fontWeight: 700, marginBottom: 6 }}>
                    {q.text ?? q.title ?? q.label ?? q.id}
                    <span style={saveBadgeStyle(saveState)}>{saveBadgeText(saveState)}</span>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    {/* student */}
                    <div
                      style={{
                        padding: 12,
                        border: "1px solid #eee",
                        borderRadius: 12,
                        background: "#fafafa",
                      }}
                    >
                      <div style={{ fontSize: 12, color: "#666", marginBottom: 6 }}>
                        Student score
                      </div>
                      <div style={{ fontSize: 13 }}>
                        <span style={{ color: typeof sScore === "number" ? scoreColor(sScore) : "#666" }}>
                          {studentScoreText}
                        </span>
                      </div>
                    </div>

                    {/* teacher */}
                    <div
                      style={{
                        padding: 12,
                        border: "1px solid #eee",
                        borderRadius: 12,
                        background: "#fff",
                        overflow: "hidden",
                      }}
                    >
                      <div style={{ fontSize: 12, color: "#666", marginBottom: 6 }}>
                        Docent correctie (per vraag)
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: teacherScoreValue === null ? "#666" : scoreColor(teacherScoreValue) }}>
                          {teacherScoreText}
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            scheduleSaveTeacherScore({
                              themeId: theme.id,
                              questionId: q.id,
                              correctedScore: null,
                              feedback: tRow.feedback ?? "",
                            });
                          }}
                          disabled={!assessmentId || busy}
                          style={{
                            marginLeft: "auto",
                            padding: "6px 10px",
                            borderRadius: 10,
                            border: "1px solid #ddd",
                            background: "#fff",
                            cursor: !assessmentId || busy ? "not-allowed" : "pointer",
                            fontSize: 12,
                            fontWeight: 700,
                          }}
                          title="Maak docentcorrectie leeg voor deze vraag"
                        >
                          Maak leeg
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleRow(rowKey)}
                          style={{
                            padding: "6px 10px",
                            borderRadius: 10,
                            border: "1px solid #ddd",
                            background: "#fff",
                            cursor: "pointer",
                            fontSize: 12,
                            fontWeight: 700,
                          }}
                        >
                          {isOpen ? "▾" : "▸"} Feedback
                        </button>
                      </div>

                      <input
                        type="range"
                        min={rubric1VO.scale.min}
                        max={rubric1VO.scale.max}
                        value={clampToScale(teacherScoreValue ?? 5)}
                        onChange={(e) => {
                          const v = clampToScale(Number(e.target.value));
                          scheduleSaveTeacherScore({
                            themeId: theme.id,
                            questionId: q.id,
                            correctedScore: v,
                            feedback: tRow.feedback ?? "",
                          });
                        }}
                        disabled={!assessmentId || busy}
                        style={{ width: "100%", marginTop: 10 }}
                      />

                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#666", marginTop: 6 }}>
                        <span>{rubric1VO.scale.min}</span>
                        <span style={{ fontFamily: "monospace" }}>{teacherScoreValue ?? "—"}</span>
                        <span>{rubric1VO.scale.max}</span>
                      </div>

                      {isOpen && (
                        <div style={{ marginTop: 10 }}>
                          <textarea
                            value={tRow.feedback ?? ""}
                            onChange={(e) => {
                              scheduleSaveTeacherScore({
                                themeId: theme.id,
                                questionId: q.id,
                                correctedScore: tRow.correctedScore ?? null,
                                feedback: e.target.value,
                              });
                            }}
                            rows={3}
                            disabled={!assessmentId || busy}
                            placeholder="Docentfeedback per vraag (optioneel)"
                            style={{
                              width: "100%",
                              maxWidth: "100%",
                              boxSizing: "border-box",
                              padding: 12,
                              border: "1px solid #ddd",
                              borderRadius: 12,
                              resize: "vertical",
                              background: "#fff",
                              display: "block",
                            }}
                          />

                          <div style={{ fontSize: 12, color: "#666", marginTop: 6 }}>
                            Tip: feedback autosaved (draft/publish bepaalt zichtbaarheid voor student).
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </main>
  );
}
