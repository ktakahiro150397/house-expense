"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 同じ description を持つ全明細のカテゴリを一括更新（個別固定済みの明細は除外）
export async function updateTransactionCategory(
  description: string,
  categoryId: number | null
): Promise<void> {
  const session = await auth();
  if (!session?.user) throw new Error("未認証");
  await prisma.transaction.updateMany({
    where: { description, categoryIsOverridden: false },
    data: { categoryId },
  });
}

// 特定の明細のみカテゴリを変更し、個別固定フラグを立てる
export async function updateSingleTransactionCategory(
  id: number,
  categoryId: number | null
): Promise<void> {
  const session = await auth();
  if (!session?.user) throw new Error("未認証");
  await prisma.transaction.update({
    where: { id },
    data: { categoryId, categoryIsOverridden: true },
  });
}

// 特定の明細を個別固定モードにする（カテゴリは変更しない）
export async function setCategoryOverride(id: number): Promise<void> {
  const session = await auth();
  if (!session?.user) throw new Error("未認証");
  await prisma.transaction.update({
    where: { id },
    data: { categoryIsOverridden: true },
  });
}

// 個別固定を解除する（以降は一括更新の対象に戻る）
export async function clearCategoryOverride(id: number): Promise<void> {
  const session = await auth();
  if (!session?.user) throw new Error("未認証");
  await prisma.transaction.update({
    where: { id },
    data: { categoryIsOverridden: false },
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

// 同じ description を持つ全明細の種別を一括更新
export async function updateTransactionType(
  description: string,
  type: string
): Promise<void> {
  const session = await auth();
  if (!session?.user) throw new Error("未認証");
  await prisma.transaction.updateMany({
    where: { description },
    data: { type },
  });
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
