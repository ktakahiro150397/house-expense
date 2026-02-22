import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getUnsettledTransactions } from "@/lib/actions/settlement";
import { calculateSettlement } from "@/lib/settlement";
import SettlementSummaryCard from "./_components/SettlementSummaryCard";
import UnsettledList from "./_components/UnsettledList";
import SettlementConfirmButton from "./_components/SettlementConfirmButton";

export default async function SettlementPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");

  const transactions = await getUnsettledTransactions();

  const settlementInput = transactions.map((tx) => ({
    userId: tx.userId,
    amount: tx.amount,
  }));

  const result = calculateSettlement(settlementInput);

  // ユーザー名マップを構築
  const userNames = new Map<number, string>();
  for (const tx of transactions) {
    if (!userNames.has(tx.userId)) {
      userNames.set(tx.userId, tx.user.name ?? tx.user.email);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">精算</h1>

      {transactions.length === 0 ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          未精算の共有支出はありません
        </div>
      ) : (
        <>
          <SettlementSummaryCard
            result={result}
            userNames={userNames}
          />
          <UnsettledList transactions={transactions} />
          <SettlementConfirmButton />
        </>
      )}
    </div>
  );
}
