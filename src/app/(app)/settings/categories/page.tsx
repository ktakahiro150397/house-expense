import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import CategoryManager from "./_components/CategoryManager";

export default async function CategoriesPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");

  const categories = await prisma.category.findMany({
    include: {
      rules: { orderBy: { createdAt: "asc" } },
      _count: { select: { transactions: true } },
    },
    orderBy: { seq: "asc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">カテゴリ管理</h1>
      <CategoryManager categories={categories} />
    </div>
  );
}
