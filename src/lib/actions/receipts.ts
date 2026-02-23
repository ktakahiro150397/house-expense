"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { analyzeReceiptImage, type ReceiptAnalysisResult } from "@/lib/gemini";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "receipts");
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function uploadReceiptImage(
  transactionId: number,
  formData: FormData
): Promise<{ receiptImageUrl: string }> {
  const session = await auth();
  if (!session?.user) throw new Error("未認証");

  const file = formData.get("file") as File | null;
  if (!file) throw new Error("ファイルが選択されていません");

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error("JPEG・PNG・WebP 形式のみアップロードできます");
  }
  if (file.size > MAX_SIZE_BYTES) {
    throw new Error("ファイルサイズは 10MB 以下にしてください");
  }

  const ext = file.type === "image/webp" ? "webp"
    : file.type === "image/png" ? "png"
    : "jpg";
  const filename = `txn-${transactionId}-${Date.now()}.${ext}`;

  await mkdir(UPLOAD_DIR, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(UPLOAD_DIR, filename), buffer);

  const receiptImageUrl = `/uploads/receipts/${filename}`;

  await prisma.transaction.update({
    where: { id: transactionId },
    data: { receiptImageUrl },
  });

  return { receiptImageUrl };
}

export async function analyzeReceipt(
  transactionId: number
): Promise<ReceiptAnalysisResult> {
  const session = await auth();
  if (!session?.user) throw new Error("未認証");

  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    select: { receiptImageUrl: true },
  });

  if (!transaction?.receiptImageUrl) {
    throw new Error("レシート画像が見つかりません");
  }

  const localPath = path.join(process.cwd(), "public", transaction.receiptImageUrl);
  const result = await analyzeReceiptImage(localPath);

  // alias 検索して productMasterId を自動セット
  const aliasMap = new Map();
  for (const item of result.items) {
    if (!aliasMap.has(item.name)) {
      const alias = await prisma.productNameAlias.findUnique({
        where: { rawName: item.name },
      });
      aliasMap.set(item.name, alias?.productMasterId ?? null);
    }
  }

  await prisma.$transaction([
    prisma.receiptItem.deleteMany({ where: { transactionId } }),
    prisma.receiptItem.createMany({
      data: result.items.map((item) => ({
        transactionId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        productMasterId: aliasMap.get(item.name) ?? null,
      })),
    }),
  ]);

  return result;
}

export async function updateReceiptItems(
  transactionId: number,
  items: Array<{ name: string; price: number; quantity: number }>
): Promise<void> {
  const session = await auth();
  if (!session?.user) throw new Error("未認証");

  const filtered = items.filter((item) => item.name.trim() !== "");

  await prisma.$transaction([
    prisma.receiptItem.deleteMany({ where: { transactionId } }),
    prisma.receiptItem.createMany({
      data: filtered.map((item) => ({ transactionId, ...item })),
    }),
  ]);
}

export async function assignProduct(
  receiptItemId: number,
  input: { productMasterId: number } | { newName: string }
): Promise<void> {
  const session = await auth();
  if (!session?.user) throw new Error('未認証');

  // 対象 ReceiptItem を取得（rawName として使用）
  const receiptItem = await prisma.receiptItem.findUnique({
    where: { id: receiptItemId },
    select: { name: true },
  });
  if (!receiptItem) throw new Error('品目が見つかりません');

  const rawName = receiptItem.name;

  let productMasterId: number;

  if ('productMasterId' in input) {
    productMasterId = input.productMasterId;
  } else {
    // 新規 ProductMaster を作成（既存なら取得）
    const master = await prisma.productMaster.upsert({
      where: { name: input.newName },
      create: { name: input.newName },
      update: {},
    });
    productMasterId = master.id;
  }

  // ProductNameAlias を upsert
  await prisma.productNameAlias.upsert({
    where: { rawName },
    create: { rawName, productMasterId },
    update: { productMasterId },
  });

  // 同じ rawName を持つ全 ReceiptItem に自動適用（batch update）
  await prisma.receiptItem.updateMany({
    where: { name: rawName },
    data: { productMasterId },
  });
}

export async function getProductMasters(): Promise<Array<{ id: number; name: string }>> {
  return prisma.productMaster.findMany({
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });
}
