"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Pencil } from "lucide-react";
import { updateLoan } from "@/lib/actions/loans";
import type { Loan, LoanSchedule } from "@/generated/prisma/client";

type LoanWithSchedules = Loan & { schedules: LoanSchedule[] };

function toYM(d: Date) {
  const date = new Date(d);
  return { year: date.getFullYear(), month: date.getMonth() + 1 };
}

export default function EditLoanDialog({ loan }: { loan: LoanWithSchedules }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");

  // 現在値を初期値として使う
  const unpaidSchedules = loan.schedules.filter((s) => s.status === "unpaid");
  const currentMonthlyAmount =
    unpaidSchedules.length > 0
      ? unpaidSchedules[0].amount
      : loan.schedules[0]?.amount ?? 0;
  const currentDueDay =
    unpaidSchedules.length > 0
      ? new Date(unpaidSchedules[0].dueDate).getDate()
      : loan.schedules[0]
      ? new Date(loan.schedules[0].dueDate).getDate()
      : 27;
  const endYM = toYM(loan.endDate);

  const [name, setName] = useState(loan.name);
  const [monthlyAmount, setMonthlyAmount] = useState(String(currentMonthlyAmount));
  const [dueDay, setDueDay] = useState(String(currentDueDay));
  const [endYear, setEndYear] = useState(String(endYM.year));
  const [endMonth, setEndMonth] = useState(String(endYM.month));

  function resetForm() {
    setName(loan.name);
    setMonthlyAmount(String(currentMonthlyAmount));
    setDueDay(String(currentDueDay));
    setEndYear(String(endYM.year));
    setEndMonth(String(endYM.month));
    setError("");
  }

  // 変更プレビューの計算
  const newEndYM = Number(endYear) * 12 + (Number(endMonth) - 1);
  const currentEndYM = endYM.year * 12 + (endYM.month - 1);
  const endDiff = newEndYM - currentEndYM; // 正=延長, 負=短縮

  const unpaidCount = unpaidSchedules.length;
  const amountChanged = Number(monthlyAmount) !== currentMonthlyAmount;
  const dueDayChanged = Number(dueDay) !== currentDueDay;

  // 短縮時に削除される未払い件数
  const deletedCount =
    endDiff < 0
      ? unpaidSchedules.filter((s) => {
          const d = new Date(s.dueDate);
          const ym = d.getFullYear() * 12 + d.getMonth();
          return ym > newEndYM;
        }).length
      : 0;

  function handleSubmit() {
    if (!name.trim() || !monthlyAmount || !dueDay) {
      setError("すべての項目を入力してください");
      return;
    }
    if (newEndYM < currentEndYM - 0 && deletedCount > 0) {
      if (
        !window.confirm(
          `終了月を短縮すると、未払いのスケジュール ${deletedCount} 件が削除されます。続けますか？`
        )
      )
        return;
    }
    setError("");
    startTransition(async () => {
      try {
        await updateLoan({
          id: loan.id,
          name: name.trim(),
          monthlyAmount: Number(monthlyAmount),
          dueDay: Number(dueDay),
          endYear: Number(endYear),
          endMonth: Number(endMonth),
        });
        setOpen(false);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "更新に失敗しました");
      }
    });
  }

  return (
    <>
      <Button
        size="icon"
        variant="ghost"
        className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
        onClick={() => { resetForm(); setOpen(true); }}
        title="ローンを編集"
      >
        <Pencil className="h-4 w-4" />
      </Button>

      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) resetForm();
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>ローンを編集</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* ローン名 */}
            <div>
              <label className="text-sm font-medium mb-1 block">ローン名</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isPending}
              />
            </div>

            {/* 月額 */}
            <div>
              <label className="text-sm font-medium mb-1 block">
                月額返済額（円）
              </label>
              <Input
                type="number"
                value={monthlyAmount}
                onChange={(e) => setMonthlyAmount(e.target.value)}
                disabled={isPending}
              />
              {amountChanged && unpaidCount > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  未払い {unpaidCount} 件を ¥{Number(monthlyAmount).toLocaleString()} に更新します
                </p>
              )}
            </div>

            {/* 返済日 */}
            <div>
              <label className="text-sm font-medium mb-1 block">
                毎月の返済日
              </label>
              <div className="flex gap-2 items-center">
                <Input
                  type="number"
                  className="w-20"
                  min={1}
                  max={31}
                  value={dueDay}
                  onChange={(e) => setDueDay(e.target.value)}
                  disabled={isPending}
                />
                <span className="text-sm">日</span>
              </div>
              {dueDayChanged && unpaidCount > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  未払い {unpaidCount} 件の返済日を {dueDay} 日に更新します
                </p>
              )}
            </div>

            {/* 終了月 */}
            <div>
              <label className="text-sm font-medium mb-1 block">終了月</label>
              <div className="flex gap-2 items-center">
                <Input
                  type="number"
                  className="w-24"
                  value={endYear}
                  onChange={(e) => setEndYear(e.target.value)}
                  disabled={isPending}
                />
                <span className="text-sm">年</span>
                <Input
                  type="number"
                  className="w-16"
                  min={1}
                  max={12}
                  value={endMonth}
                  onChange={(e) => setEndMonth(e.target.value)}
                  disabled={isPending}
                />
                <span className="text-sm">月</span>
              </div>
              {endDiff > 0 && (
                <p className="text-xs text-blue-600 mt-1">
                  {endDiff} か月延長（スケジュール {endDiff} 件を追加）
                </p>
              )}
              {endDiff < 0 && deletedCount > 0 && (
                <p className="text-xs text-destructive mt-1">
                  {Math.abs(endDiff)} か月短縮（未払い {deletedCount} 件を削除）
                </p>
              )}
              {endDiff < 0 && deletedCount === 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {Math.abs(endDiff)} か月短縮（削除対象の未払いなし）
                </p>
              )}
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setOpen(false); resetForm(); }}
              disabled={isPending}
            >
              キャンセル
            </Button>
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending ? "更新中..." : "更新"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
