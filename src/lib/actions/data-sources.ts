"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";

async function requireAuth() {
  const session = await auth();
  if (!session?.user) throw new Error("未認証");
}

export async function createDataSource(
  name: string,
  type: string,
  institution?: string
): Promise<void> {
  await requireAuth();
  await prisma.dataSource.create({
    data: {
      name: name.trim(),
      type,
      institution: institution?.trim() || null,
    },
  });
  revalidatePath("/settings/data-sources");
}

export async function updateDataSource(
  id: number,
  name: string,
  type: string,
  institution?: string
): Promise<void> {
  await requireAuth();
  await prisma.dataSource.update({
    where: { id },
    data: {
      name: name.trim(),
      type,
      institution: institution?.trim() || null,
    },
  });
  revalidatePath("/settings/data-sources");
}

export async function deleteDataSource(id: number): Promise<void> {
  await requireAuth();
  const count = await prisma.transaction.count({ where: { dataSourceId: id } });
  if (count > 0) {
    throw new Error("このデータソースには明細が存在するため削除できません");
  }
  await prisma.dataSource.delete({ where: { id } });
  revalidatePath("/settings/data-sources");
}
