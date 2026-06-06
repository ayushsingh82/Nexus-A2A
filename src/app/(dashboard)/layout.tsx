import Sidebar from "@/components/Sidebar";
import AppShellHeader from "@/components/AppShellHeader";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="app-main">
        <AppShellHeader />
        {children}
      </main>
    </div>
  );
}
