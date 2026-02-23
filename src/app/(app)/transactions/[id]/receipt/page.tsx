import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ReceiptDetailEditor from "./_components/ReceiptDetailEditor";
import { getProductMasters } from "@/lib/actions/receipts";

export default async function ReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");

  const { id } = await params;
  const transactionId = Number(id);

  if (isNaN(transactionId)) notFound();

  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    select: {
      id: true,
      description: true,
      usageDate: true,
      amount: true,
      type: true,
      receiptImageUrl: true,
      receiptItems: {
        select: { id: true, name: true, price: true, quantity: true, productMasterId: true },
        orderBy: { id: "asc" },
      },
    },
  });

  if (!transaction) notFound();

  const [usageDate2, productMasters] = await Promise.all([
    Promise.resolve(new Date(transaction.usageDate)),
    getProductMasters(),
  ]);
  const usageDate = usageDate2;
  const dateStr = `${usageDate.getFullYear()}/${String(usageDate.getMonth() + 1).padStart(2, "0")}/${String(usageDate.getDate()).padStart(2, "0")}`;

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      <div className="flex items-center gap-2 flex-wrap">
        <Link
          href="/transactions"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="size-4" />
          明細一覧
        </Link>
        <span className="text-muted-foreground">/</span>
        <h1 className="text-base font-medium truncate max-w-[240px]">
          {transaction.description}
        </h1>
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {dateStr} &nbsp;¥{Math.abs(transaction.amount).toLocaleString()}
        </span>
      </div>

      <ReceiptDetailEditor transaction={transaction} productMasters={productMasters} />
    </div>
  );
}
