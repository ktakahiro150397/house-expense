import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import DataSourceManager from "./_components/DataSourceManager";

export default async function DataSourcesPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");

  const dataSources = await prisma.dataSource.findMany({
    include: {
      _count: { select: { transactions: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">データソース管理</h1>
      <DataSourceManager dataSources={dataSources} />
    </div>
  );
}
