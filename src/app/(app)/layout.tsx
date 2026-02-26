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
    <div className="flex h-dvh flex-col md:flex-row overflow-hidden">
      <Sidebar />
      <MobileHeader isAdmin={isAdmin} />
      <main className="flex-1 min-h-0 overflow-y-auto overscroll-none p-4 md:p-8">{children}</main>
    </div>
  );
}
