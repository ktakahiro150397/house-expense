"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { createLoan } from "@/lib/actions/loans";

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

export default function AddLoanDialog() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const [name, setName] = useState("");
  const [startYear, setStartYear] = useState(String(currentYear));
  const [startMonth, setStartMonth] = useState(String(currentMonth));
  const [endYear, setEndYear] = useState(String(currentYear + 35));
  const [endMonth, setEndMonth] = useState(String(currentMonth > 1 ? currentMonth - 1 : 12));
  const [monthlyAmount, setMonthlyAmount] = useState("");
  const [dueDay, setDueDay] = useState("27");
  const [markPastAsPaid, setMarkPastAsPaid] = useState(true);
  const [error, setError] = useState("");

  function resetForm() {
    setName("");
    setStartYear(String(currentYear));
    setStartMonth(String(currentMonth));
    setEndYear(String(currentYear + 35));
    setEndMonth(String(currentMonth > 1 ? currentMonth - 1 : 12));
    setMonthlyAmount("");
    setDueDay("27");
    setMarkPastAsPaid(true);
    setError("");
  }

  // 返済回数を計算
  const totalMonths =
    (Number(endYear) - Number(startYear)) * 12 +
    (Number(endMonth) - Number(startMonth) + 1);

  // 総額（月額 × 回数）
  const calculatedTotal =
    monthlyAmount && totalMonths > 0
      ? Number(monthlyAmount) * totalMonths
      : null;

  // 過去分（支払済予定）件数
  const now = new Date();
  const pastCount = (() => {
    if (!markPastAsPaid || totalMonths <= 0) return 0;
    let count = 0;
    let y = Number(startYear);
    let m = Number(startMonth);
    const ey = Number(endYear);
    const em = Number(endMonth);
    const day = Number(dueDay);
    while (y < ey || (y === ey && m <= em)) {
      if (new Date(y, m - 1, day) < now) count++;
      m++;
      if (m > 12) { m = 1; y++; }
    }
    return count;
  })();

  function handleSubmit() {
    if (!name.trim() || !monthlyAmount || totalMonths <= 0) {
      setError("ローン名・月額・期間は必須です");
      return;
    }
    setError("");
    startTransition(async () => {
      try {
        await createLoan({
          name: name.trim(),
          startYear: Number(startYear),
          startMonth: Number(startMonth),
          endYear: Number(endYear),
          endMonth: Number(endMonth),
          monthlyAmount: Number(monthlyAmount),
          dueDay: Number(dueDay),
          markPastAsPaid,
        });
        setOpen(false);
        resetForm();
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "登録に失敗しました");
      }
    });
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4 mr-1" />
        ローンを追加
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
            <DialogTitle>ローンを追加</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* ローン名 */}
            <div>
              <label className="text-sm font-medium mb-1 block">
                ローン名 <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="例: 住宅ローン"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isPending}
              />
            </div>

            {/* 月額 */}
            <div>
              <label className="text-sm font-medium mb-1 block">
                月額返済額（円） <span className="text-destructive">*</span>
              </label>
              <Input
                type="number"
                placeholder="例: 85000"
                value={monthlyAmount}
                onChange={(e) => setMonthlyAmount(e.target.value)}
                disabled={isPending}
              />
            </div>

            {/* 開始月 */}
            <div>
              <label className="text-sm font-medium mb-1 block">開始月</label>
              <div className="flex gap-2 items-center">
                <Input
                  type="number"
                  className="w-24"
                  placeholder="年"
                  value={startYear}
                  onChange={(e) => setStartYear(e.target.value)}
                  disabled={isPending}
                />
                <span className="text-sm">年</span>
                <Input
                  type="number"
                  className="w-16"
                  min={1}
                  max={12}
                  value={startMonth}
                  onChange={(e) => setStartMonth(e.target.value)}
                  disabled={isPending}
                />
                <span className="text-sm">月</span>
              </div>
            </div>

            {/* 終了月 */}
            <div>
              <label className="text-sm font-medium mb-1 block">終了月</label>
              <div className="flex gap-2 items-center">
                <Input
                  type="number"
                  className="w-24"
                  placeholder="年"
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
              {totalMonths > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {totalMonths} 回
                  {calculatedTotal !== null && (
                    <>　総額: <span className="font-medium">¥{calculatedTotal.toLocaleString()}</span></>
                  )}
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
            </div>

            {/* 過去分を支払済にする */}
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">過去分を支払済にする</p>
                <p className="text-xs text-muted-foreground">
                  {markPastAsPaid && pastCount > 0
                    ? `${pastCount} 件が支払済になります`
                    : "登録時点より前の返済日を支払済に設定します"}
                </p>
              </div>
              <Switch
                checked={markPastAsPaid}
                onCheckedChange={setMarkPastAsPaid}
                disabled={isPending}
              />
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
              {isPending ? "登録中..." : "登録"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
