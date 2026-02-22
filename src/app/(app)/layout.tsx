import Sidebar from "@/components/Sidebar";
import MobileHeader from "@/components/MobileHeader";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen flex-col md:flex-row">
      <Sidebar />
      <MobileHeader />
      <main className="flex-1 overflow-y-auto p-4 md:p-8">{children}</main>
    </div>
  );
}
