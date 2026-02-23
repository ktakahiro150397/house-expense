"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 同じ description を持つ全明細のカテゴリを一括更新
export async function updateTransactionCategory(
  description: string,
  categoryId: number | null
): Promise<void> {
  const session = await auth();
  if (!session?.user) throw new Error("未認証");
  await prisma.transaction.updateMany({
    where: { description },
    data: { categoryId },
  });
}

export async function toggleTransactionShared(
  transactionId: number,
  isShared: boolean
): Promise<void> {
  const session = await auth();
  if (!session?.user) throw new Error("未認証");
  await prisma.transaction.update({
    where: { id: transactionId },
    data: { isShared },
  });
}

export async function deleteTransaction(id: number): Promise<void> {
  const session = await auth();
  if (!session?.user) throw new Error("未認証");
  await prisma.transaction.delete({ where: { id } });
}

export async function addCategoryRule(
  categoryId: number,
  keyword: string
): Promise<void> {
  const session = await auth();
  if (!session?.user) throw new Error("未認証");
  await prisma.categoryRule.upsert({
    where: { keyword },
    update: { categoryId },
    create: { categoryId, keyword },
  });
}
