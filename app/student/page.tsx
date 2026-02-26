"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type UserInfo = {
  voornaam: string;
  tussenvoegsel: string | null;
  achternaam: string;
};

type Credential = {
  exam1Completed: boolean;
  exam2Completed: boolean;
  exam3Completed: boolean;

  mbkCompleted: boolean;
  psbkCompleted: boolean;

  leertherapieCount: number;
  intervisieCount: number;
  supervisieCount: number;
  eindsupervisieDone: boolean;
};

type EnrollmentRow = {
  id: string;
  cohort: {
    id: string;
    naam: string;
    uitvoeringId: string;
    traject?: string | null;
  };
};

type ApiPayload = {
  ok: boolean;
  user: UserInfo;
  enrollments: EnrollmentRow[];
  maxStage: "BASISJAAR" | "1VO" | "2VO" | "3VO" | null;
  credential: Credential;
  error?: string;
};

const REQUIRED = {
  leertherapie: 10,
  intervisie: 10,
  supervisie: 12,
};

function stageRank(stage: ApiPayload["maxStage"]) {
  if (stage === "BASISJAAR") return 0;
  if (stage === "1VO") return 1;
  if (stage === "2VO") return 2;
  if (stage === "3VO") return 3;
  return -1;
}

function Dot({ state }: { state: "done" | "current" | "todo" }) {
  const color = state === "done" ? "#2e7d32" : state === "current" ? "#ef6c00" : "#bbb";
  return (
    <span
      title={state === "done" ? "Afgerond" : state === "current" ? "Huidig" : "Nog niet gestart"}
      style={{
        width: 10,
        height: 10,
        borderRadius: 999,
        display: "inline-block",
        background: color,
      }}
    />
  );
}

function CountChip({ value, required }: { value: number; required: number }) {
  const color = value >= required ? "#2e7d32" : value === 0 ? "#c62828" : "#ef6c00";
  return <span style={{ color }}>{value}/{required}</span>;
}

export default function StudentDashboardPage() {
  const [status, setStatus] = useState("Laden...");
  const [data, setData] = useState<ApiPayload | null>(null);

  const [currentUitvoering, setCurrentUitvoering] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        // 1) huidige uitvoering ophalen (admin-instelling) - ✅ juiste route
        const rU = await fetch("/api/admin/system/current-uitvoering");
        const jU = await rU.json().catch(() => ({}));
        if (!cancelled) {
          setCurrentUitvoering(rU.ok && jU?.ok ? (jU.uitvoeringId ?? null) : null);
        }

        // 2) dossier ophalen - ✅ geen userId meer (impersonation-aware op server)
        const res = await fetch("/api/student/dossier");
        const json = (await res.json().catch(() => ({}))) as ApiPayload;

        if (!res.ok || !json?.ok) {
          if (!cancelled) setStatus(`Laden faalde (${res.status}): ${json?.error ?? "onbekend"}`);
          return;
        }

        if (cancelled) return;
        setData(json);
        setStatus("");
      } catch {
        if (!cancelled) setStatus("Laden faalde.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const fullName = useMemo(() => {
    if (!data?.user) return "";
    const u = data.user;
    return [u.voornaam, u.tussenvoegsel, u.achternaam].filter(Boolean).join(" ");
  }, [data]);

  const max = data?.maxStage ?? null;
  const maxR = stageRank(max);

  function yearState(target: number): "done" | "current" | "todo" {
    if (maxR < 0) return "todo";
    if (maxR > target) return "done";
    if (maxR === target) return "current";
    return "todo";
  }

  const cred = data?.credential ?? null;

  // Zichtbaarheidsregels
  const showLeertherapie = maxR >= 1; // vanaf 1VO
  const showPraktijk3VO = maxR >= 3;  // intervisie/supervisie/eindsupervisie vanaf 3VO

  const exam1State =
    maxR < 1 ? "todo" : cred?.exam1Completed ? "done" : maxR === 1 ? "current" : "todo";
  const exam2State =
    maxR < 2 ? "todo" : cred?.exam2Completed ? "done" : maxR === 2 ? "current" : "todo";
  const exam3State =
    maxR < 3 ? "todo" : cred?.exam3Completed ? "done" : maxR === 3 ? "current" : "todo";

  // Cohorts groeperen op uitvoeringId, met "huidige uitvoering" bovenaan
  const groups = useMemo(() => {
    const map = new Map<string, EnrollmentRow[]>();
    const list = data?.enrollments ?? [];
    for (const e of list) {
      const u = e.cohort.uitvoeringId || "—";
      if (!map.has(u)) map.set(u, []);
      map.get(u)!.push(e);
    }

    const uitvoeringen = Array.from(map.keys()).sort((a, b) => a.localeCompare(b));

    if (currentUitvoering && uitvoeringen.includes(currentUitvoering)) {
      uitvoeringen.splice(uitvoeringen.indexOf(currentUitvoering), 1);
      uitvoeringen.unshift(currentUitvoering);
    }

    return uitvoeringen.map((u) => ({
      uitvoeringId: u,
      isCurrent: currentUitvoering ? u === currentUitvoering : false,
      enrollments: (map.get(u) ?? []).slice().sort((a, b) => a.cohort.naam.localeCompare(b.cohort.naam)),
    }));
  }, [data, currentUitvoering]);

  return (
    <main style={{ padding: 32, maxWidth: 1000, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 8 }}>
        Dashboard{fullName ? ` · ${fullName}` : ""}
      </h1>

      <div style={{ color: "#666", marginBottom: 18 }}>
        {currentUitvoering ? (
          <>Huidige uitvoering: <span style={{ fontFamily: "monospace" }}>{currentUitvoering}</span>. </>
        ) : null}
        Voor het invullen van je volgsysteem gebruik je de knop hieronder.
      </div>

      {/* CTA */}
      <div
        style={{
          border: "1px solid #eee",
          borderRadius: 14,
          padding: 16,
          background: "#fafafa",
          display: "flex",
          alignItems: "center",
          gap: 16,
          marginBottom: 22,
          flexWrap: "wrap",
        }}
      >
        <div style={{ flex: "1 1 320px" }}>
          <div style={{ fontSize: 14, color: "#111", marginBottom: 6 }}>
            Volgsysteem invullen
          </div>
          <div style={{ fontSize: 12, color: "#666" }}>
            Klik om je reflectie/vragenlijst voor dit moment te openen.
          </div>
        </div>

        <Link
          href="/student/volgsysteem"
          style={{
            display: "inline-block",
            padding: "10px 14px",
            borderRadius: 12,
            background: "#111",
            color: "white",
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          Open volgsysteem →
        </Link>
      </div>

      {status ? (
        <div style={{ padding: 12, border: "1px solid #eee", borderRadius: 12, background: "#fff", marginBottom: 20 }}>
          {status}
        </div>
      ) : null}

      {/* Overzicht */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <section style={{ border: "1px solid #eee", borderRadius: 14, padding: 16 }}>
          <div style={{ marginBottom: 10 }}>Ontwikkelprofiel</div>
          <div style={{ color: "#666", fontSize: 12 }}>
            (Komt hier) skillsets + ontwikkeling op basis van ingevulde data.
          </div>
        </section>

        <section style={{ border: "1px solid #eee", borderRadius: 14, padding: 16 }}>
          <div style={{ marginBottom: 10 }}>Opleidingsdossier</div>

          {!data || !cred ? (
            <div style={{ color: "#666", fontSize: 12 }}>Geen gegevens.</div>
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span>Basisjaar</span>
                <Dot state={yearState(0)} />
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span>Jaar 1 vakopleiding</span>
                <Dot state={yearState(1)} />
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingLeft: 10 }}>
                <span>Tentamen Ontwikkelingspsychologie (1VO)</span>
                <Dot state={exam1State as any} />
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span>Jaar 2 vakopleiding</span>
                <Dot state={yearState(2)} />
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingLeft: 10 }}>
                <span>Tentamen Haptonomische Fenomenen (2VO)</span>
                <Dot state={exam2State as any} />
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span>Jaar 3 vakopleiding</span>
                <Dot state={yearState(3)} />
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingLeft: 10 }}>
                <span>Tentamen Psychopathologie (3VO)</span>
                <Dot state={exam3State as any} />
              </div>

              <div style={{ height: 1, background: "#eee", margin: "8px 0" }} />

              {showLeertherapie ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span>Leertherapie</span>
                  <CountChip value={cred.leertherapieCount} required={REQUIRED.leertherapie} />
                </div>
              ) : null}

              {showPraktijk3VO ? (
                <>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span>Intervisie</span>
                    <CountChip value={cred.intervisieCount} required={REQUIRED.intervisie} />
                  </div>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span>Supervisie</span>
                    <CountChip value={cred.supervisieCount} required={REQUIRED.supervisie} />
                  </div>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span>Eindsupervisie</span>
                    <Dot state={cred.eindsupervisieDone ? "done" : "current"} />
                  </div>
                </>
              ) : null}

              <div style={{ height: 1, background: "#eee", margin: "8px 0" }} />

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span>MBK</span>
                <Dot state={cred.mbkCompleted ? "done" : "current"} />
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span>PSBK</span>
                <Dot state={cred.psbkCompleted ? "done" : "current"} />
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Mijn cohorts (uitvoering-gegroepeerd) */}
      <section style={{ border: "1px solid #eee", borderRadius: 14, padding: 16, marginTop: 24 }}>
        <div style={{ marginBottom: 10 }}>Mijn cohorts</div>

        {!data?.enrollments?.length ? (
          <div style={{ color: "#666", fontSize: 12 }}>Geen cohorts gevonden.</div>
        ) : (
          <div style={{ display: "grid", gap: 14 }}>
            {groups.map((g) => (
              <div key={g.uitvoeringId}>
                <div style={{ fontSize: 12, color: "#666", marginBottom: 8 }}>
                  {g.isCurrent ? "Huidige uitvoering" : "Eerder"} ·{" "}
                  <span style={{ fontFamily: "monospace" }}>{g.uitvoeringId}</span>
                </div>

                <div style={{ display: "grid", gap: 10 }}>
                  {g.enrollments.map((e) => (
                    <div
                      key={e.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "10px 12px",
                        border: "1px solid #eee",
                        borderRadius: 12,
                        background: g.isCurrent ? "#fafafa" : "#fff",
                        flexWrap: "wrap",
                      }}
                    >
                      <div style={{ flex: "1 1 320px" }}>
                        <div style={{ fontWeight: 600 }}>{e.cohort.naam}</div>
                        <div style={{ fontSize: 12, color: "#666" }}>
                          uitvoering {e.cohort.uitvoeringId}
                        </div>
                      </div>

                      <Link
                        href={`/student/volgsysteem?enrollmentId=${encodeURIComponent(e.id)}`}
                        style={{
                          display: "inline-block",
                          padding: "8px 10px",
                          borderRadius: 10,
                          border: "1px solid #ddd",
                          background: "#fff",
                          color: "#111",
                          textDecoration: "none",
                          fontSize: 13,
                        }}
                        title={g.isCurrent ? "Open om in te vullen" : "Open archief (alleen lezen)"}
                      >
                        {g.isCurrent ? "Open →" : "Archief →"}
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div style={{ fontSize: 12, color: "#666" }}>
              Archief is read-only: je ziet alleen meetmomenten die destijds zijn ingevuld/ingeleverd.
            </div>
          </div>
        )}
      </section>
    </main>
  );
}