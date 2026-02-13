export const metadata = {
  title: "Synergos Volgsysteem",
  description: "Volgsysteem Vakopleiding Haptonomie"
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="nl">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
