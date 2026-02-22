import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import LoanCard from "./_components/LoanCard";
import AddLoanDialog from "./_components/AddLoanDialog";

export default async function LoansPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");

  const loans = await prisma.loan.findMany({
    include: {
      schedules: {
        orderBy: { dueDate: "asc" },
      },
    },
    orderBy: { startDate: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">ローン管理</h1>
        <AddLoanDialog />
      </div>

      {loans.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4 text-muted-foreground">
          <p>登録されているローンはありません</p>
        </div>
      ) : (
        <div className="space-y-6">
          {loans.map((loan) => (
            <LoanCard key={loan.id} loan={loan} />
          ))}
        </div>
      )}
    </div>
  );
}
