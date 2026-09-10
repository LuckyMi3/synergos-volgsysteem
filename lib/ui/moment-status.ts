// Gedeelde M1/M2/M3 status-badge logica, gebruikt door alle docent-overzichten
// zodat de kleuren/labels overal consistent zijn.

export type MomentStatusValue = "GEEN" | "LEEG" | "INGEVULD" | "CONCEPT" | "GEPUBLICEERD";

export function badgeStyle(status: MomentStatusValue) {
  switch (status) {
    case "GEPUBLICEERD":
      return { background: "#111", color: "#fff", border: "1px solid #111" };
    case "CONCEPT":
      return { background: "#fffbeb", color: "#92400e", border: "1px solid #fde68a" };
    case "INGEVULD":
      return { background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe" };
    case "LEEG":
      return { background: "#f3f4f6", color: "#6b7280", border: "1px solid #e5e7eb" };
    default:
      return { background: "#fafafa", color: "#b0b0b0", border: "1px solid #eee" };
  }
}

export function badgeLabel(status: MomentStatusValue) {
  switch (status) {
    case "GEPUBLICEERD":
      return "Gepubliceerd";
    case "CONCEPT":
      return "Concept";
    case "INGEVULD":
      return "Ingevuld";
    case "LEEG":
      return "Gestart";
    default:
      return "Nog niet";
  }
}
