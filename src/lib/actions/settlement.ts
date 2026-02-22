"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";

export async function finalizeSettlement(): Promise<void> {
  const session = await auth();
  if (!session?.user) throw new Error("未認証");

  await prisma.transaction.updateMany({
    where: {
      isShared: true,
      settlementDate: null,
    },
    data: {
      settlementDate: new Date(),
    },
  });

  revalidatePath("/settlement");
}

export async function getUnsettledTransactions() {
  return prisma.transaction.findMany({
    where: {
      isShared: true,
      settlementDate: null,
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
      category: { select: { id: true, name: true } },
    },
    orderBy: { usageDate: "desc" },
  });
}
