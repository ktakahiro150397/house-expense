"use client";

import { useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import type { Loan, LoanSchedule } from "@/generated/prisma/client";
import ScheduleTable from "./ScheduleTable";
import EditLoanDialog from "./EditLoanDialog";
import { deleteLoan } from "@/lib/actions/loans";

type LoanWithSchedules = Loan & { schedules: LoanSchedule[] };

function formatDate(d: Date): string {
  const date = new Date(d);
  return `${date.getFullYear()}年${String(date.getMonth() + 1).padStart(2, "0")}月`;
}

export default function LoanCard({ loan }: { loan: LoanWithSchedules }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    // display:none の要素を除外して可視要素のみ対象にする
    const targets = container.querySelectorAll<HTMLElement>("[data-first-unpaid]");
    const visible = Array.from(targets).find((el) => el.offsetParent !== null);
    if (visible) {
      const containerRect = container.getBoundingClientRect();
      const targetRect = visible.getBoundingClientRect();
      container.scrollTop += targetRect.top - containerRect.top;
    }
  }, []);

  const paidSchedules = loan.schedules.filter((s) => s.status === "paid");
  const unpaidSchedules = loan.schedules.filter((s) => s.status === "unpaid");

  const paidAmount = paidSchedules.reduce((sum, s) => sum + s.amount, 0);
  const remainingDebt = unpaidSchedules.reduce((sum, s) => sum + s.amount, 0);

  const paidCount = paidSchedules.length;
  const totalCount = loan.schedules.length;

  function handleDelete() {
    if (!window.confirm(`ローン「${loan.name}」を削除しますか？\n返済スケジュールもすべて削除されます。`)) return;
    startTransition(async () => {
      await deleteLoan(loan.id);
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <CardTitle className="text-xl truncate">{loan.name}</CardTitle>
              <EditLoanDialog loan={loan} />
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                onClick={handleDelete}
                disabled={isPending}
                title="このローンを削除"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {formatDate(loan.startDate)} 〜 {formatDate(loan.endDate)}
            </p>
            <p className="text-sm text-muted-foreground">
              総額: ¥{loan.totalAmount.toLocaleString()}　返済済: {paidCount} / {totalCount} 回
            </p>
          </div>
          <div className="flex gap-6 sm:gap-4 sm:shrink-0">
            <div>
              <p className="text-xs text-muted-foreground mb-1">支払済</p>
              <p className="text-xl font-semibold text-green-600">
                ¥{paidAmount.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">残債務</p>
              <p className="text-xl font-bold text-red-600">
                ¥{remainingDebt.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </CardHeader>
      {/* スケジュール一覧は固定高さでスクロール */}
      <CardContent className="p-0">
        <div ref={scrollContainerRef} className="max-h-72 overflow-y-auto">
          <ScheduleTable schedules={loan.schedules} />
        </div>
      </CardContent>
    </Card>
  );
}
