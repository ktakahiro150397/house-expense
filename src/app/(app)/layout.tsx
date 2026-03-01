import Sidebar from "@/components/Sidebar";
import MobileLayout from "@/components/MobileLayout";
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
      <MobileLayout isAdmin={isAdmin}>{children}</MobileLayout>
    </div>
  );
}
