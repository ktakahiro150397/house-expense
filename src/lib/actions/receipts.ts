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

  await prisma.$transaction([
    prisma.receiptItem.deleteMany({ where: { transactionId } }),
    prisma.receiptItem.createMany({
      data: result.items.map((item) => ({
        transactionId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
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
