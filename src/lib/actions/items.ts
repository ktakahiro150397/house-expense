"use server";

import { prisma } from "@/lib/prisma";

export type ProductWithStats = {
  id: number;
  name: string;
  purchaseCount: number;
  latestUnitPrice: number | null;
  latestDate: Date | null;
};

export type ProductPriceHistoryItem = {
  date: Date;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  description: string;
};

/**
 * 全 ProductMaster と統計情報（最新単価・購入回数）を返す
 */
export async function getProductsWithStats(): Promise<ProductWithStats[]> {
  const masters = await prisma.productMaster.findMany({
    include: {
      receiptItems: {
        include: {
          transaction: {
            select: { usageDate: true },
          },
        },
        orderBy: {
          transaction: { usageDate: "desc" },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return masters.map((master) => {
    const items = master.receiptItems;
    const purchaseCount = items.length;
    const latest = items[0];
    const latestUnitPrice =
      latest && latest.quantity > 0
        ? Math.round(latest.price / latest.quantity)
        : null;
    const latestDate = latest?.transaction?.usageDate ?? null;

    return {
      id: master.id,
      name: master.name,
      purchaseCount,
      latestUnitPrice,
      latestDate,
    };
  });
}

/**
 * 特定 ProductMaster の価格履歴を返す（日付昇順）
 */
export async function getProductPriceHistory(
  productMasterId: number
): Promise<ProductPriceHistoryItem[]> {
  const items = await prisma.receiptItem.findMany({
    where: { productMasterId },
    include: {
      transaction: {
        select: { usageDate: true, description: true },
      },
    },
    orderBy: {
      transaction: { usageDate: "asc" },
    },
  });

  return items.map((item) => ({
    date: item.transaction.usageDate,
    unitPrice:
      item.quantity > 0 ? Math.round(item.price / item.quantity) : item.price,
    quantity: item.quantity,
    totalPrice: item.price,
    description: item.transaction.description,
  }));
}

/**
 * ProductMaster の名前を取得する
 */
export async function getProductMasterById(
  id: number
): Promise<{ id: number; name: string } | null> {
  return prisma.productMaster.findUnique({
    where: { id },
    select: { id: true, name: true },
  });
}
