"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";

async function requireAuth() {
  const session = await auth();
  if (!session?.user) throw new Error("未認証");
}

export async function createCategory(name: string, seq?: number): Promise<void> {
  await requireAuth();
  await prisma.category.create({
    data: { name: name.trim(), seq: seq ?? 0 },
  });
  revalidatePath("/settings/categories");
}

export async function updateCategory(
  id: number,
  name: string,
  seq: number
): Promise<void> {
  await requireAuth();
  await prisma.category.update({
    where: { id },
    data: { name: name.trim(), seq },
  });
  revalidatePath("/settings/categories");
}

export async function deleteCategory(id: number): Promise<void> {
  await requireAuth();
  const count = await prisma.transaction.count({ where: { categoryId: id } });
  if (count > 0) {
    throw new Error("このカテゴリには明細が存在するため削除できません");
  }
  // 関連するCategoryRuleも削除
  await prisma.categoryRule.deleteMany({ where: { categoryId: id } });
  await prisma.category.delete({ where: { id } });
  revalidatePath("/settings/categories");
}

export async function deleteCategoryRule(id: number): Promise<void> {
  await requireAuth();
  await prisma.categoryRule.delete({ where: { id } });
  revalidatePath("/settings/categories");
}
