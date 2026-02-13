"use client";

import { useState } from "react";
import { rubric1VO } from "../../lib/rubrics/1vo";

type Moment = "M1" | "M2" | "M3";

function scoreLabel(value: number) {
  const labels = rubric1VO.scale.labels;
  if (value <= 2) return labels[0];
  if (value <= 7) return labels[5];
  return labels[10];
}

function scoreColor(value: number) {
  if (value <= 2) return "#c0392b"; // red
  if (value <= 7) return "#e67e22"; // orange
  return "#27ae60"; // green
}

function ScaleMarkers() {
  return (
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
  );
}

export default function StudentPage() {
  const [moment, setMoment] = useState<Moment>("M1");
  const [openTheme, setOpenTheme] = useState<string | null>(null);
  const [scores, setScores] = useState<Record<string, number>>({});

  function setScore(key: string, value: number) {
    setScores((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div style={{ padding: 32, maxWidth: 900, margin: "0 auto" }}>
      <h1>1VO - Vakopleiding Haptonomie</h1>

      <div style={{ marginBottom: 24 }}>
        <strong>Meetmoment:</strong>{" "}
        {(["M1", "M2", "M3"] as Moment[]).map((m) => (
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
                  <div key={key} style={{ marginBottom: 26 }}>
                    <div style={{ marginBottom: 6 }}>{q.text}</div>

                    <input
                      type="range"
                      min={rubric1VO.scale.min}
                      max={rubric1VO.scale.max}
                      value={value}
                      onChange={(e) => setScore(key, Number(e.target.value))}
                      style={{ width: "100%" }}
                    />

                    <ScaleMarkers />

                    <div
                      style={{
                        marginTop: 6,
                        fontSize: 13,
                        fontWeight: 500,
                        color: scoreColor(value),
                      }}
                    >
                      {scoreLabel(value)}
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
