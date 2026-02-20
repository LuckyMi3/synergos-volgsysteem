export default function AdminDashboardPage() {
  return (
    <div style={{ display: "grid", gap: 10 }}>
      <h2 style={{ margin: 0 }}>Dashboard</h2>
      <p style={{ margin: 0, color: "#444" }}>
        Startpunt voor admin. Hier komen straks quick actions en zoek.
      </p>

      <ul style={{ margin: 0, paddingLeft: 18, color: "#444" }}>
        <li>Zoek student</li>
        <li>Open assessment</li>
        <li>Unlock submission</li>
      </ul>
    </div>
  );
}