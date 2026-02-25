import Sidebar from "@/components/Sidebar";
import MobileHeader from "@/components/MobileHeader";
import { auth } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const isAdmin = isAdminEmail(session?.user?.email);

  return (
    <div className="flex h-screen flex-col md:flex-row">
      <Sidebar />
      <MobileHeader isAdmin={isAdmin} />
      <main className="flex-1 overflow-y-auto p-4 md:p-8">{children}</main>
    </div>
  );
}
