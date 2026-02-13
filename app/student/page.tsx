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
  if (value <= 2) return "#c0392b";   // rood
  if (value <= 7) return "#e67e22";   // oranje
  return "#27ae60";                   // groen
}

/**
 * Visuele ankers voor de schaal
 * Altijd zichtbaar, vóórdat de student schuift
 */
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
      <span style={{ color: "#c0392b" }}>
        onbekwaam / niet eigen
      </span>
      <span style={{ color: "#e67e22" }}>
        in ontwikkeling
      </span>
      <span style={{ color: "#27ae60" }}>
        bekwaam / eigen
      </span>
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
      <h1>1VO – Vakopleiding Haptonomie</h1>

      {/* Meetmoment */}
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

      {/* Accordio*
