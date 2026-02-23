import ImpersonationBanner from "../components/ImpersonationBanner";
import RoleSwitcher from "../components/RoleSwitcher";

export const metadata = {
  title: "Synergos Volgsysteem",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="nl">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif" }}>
        <ImpersonationBanner />
        <RoleSwitcher />
        {children}
      </body>
    </html>
  );
}