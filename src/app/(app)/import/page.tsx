import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import CsvUploadForm from "./_components/CsvUploadForm";

export default async function ImportPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/auth/signin");

  const [users, dbUser, dataSources] = await Promise.all([
    prisma.user.findMany({ select: { id: true, name: true, email: true } }),
    prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    }),
    prisma.dataSource.findMany({
      select: { id: true, name: true, type: true, institution: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  if (!dbUser) redirect("/auth/signin");

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">CSVインポート</h1>
        <p className="text-sm text-muted-foreground mt-1">
          SMBC銀行明細 または Vpass明細 のCSVファイルを取り込みます
        </p>
      </div>
      <CsvUploadForm users={users} currentUserId={dbUser.id} dataSources={dataSources} />
    </div>
  );
}
