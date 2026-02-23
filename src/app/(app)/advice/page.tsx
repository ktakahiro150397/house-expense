import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AdviceChat from "./_components/AdviceChat";

export default async function AdvicePage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");

  const dataSources = await prisma.dataSource.findMany({
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">AI アドバイス</h1>
      <AdviceChat dataSources={dataSources} />
    </div>
  );
}
