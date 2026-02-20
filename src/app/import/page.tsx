import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import CsvUploadForm from "./_components/CsvUploadForm";

export default async function ImportPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/auth/signin");

  const [users, dbUser] = await Promise.all([
    prisma.user.findMany({ select: { id: true, name: true, email: true } }),
    prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    }),
  ]);

  if (!dbUser) redirect("/auth/signin");

  return (
    <main className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">CSVインポート</h1>
      <CsvUploadForm users={users} currentUserId={dbUser.id} />
    </main>
  );
}
