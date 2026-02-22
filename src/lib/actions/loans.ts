"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";

type CreateLoanInput = {
  name: string;
  startYear: number;
  startMonth: number; // 1-12
  endYear: number;
  endMonth: number; // 1-12
  monthlyAmount: number;
  dueDay: number; // 返済日（例: 27）
  markPastAsPaid: boolean; // 過去分を支払済にするか
};

export async function createLoan(input: CreateLoanInput): Promise<void> {
  const session = await auth();
  if (!session?.user) throw new Error("未認証");

  const startDate = new Date(input.startYear, input.startMonth - 1, 1);
  const endDate = new Date(input.endYear, input.endMonth - 1, 1);

  if (endDate < startDate) throw new Error("終了月は開始月より後に設定してください");

  const now = new Date();

  // 月ごとのスケジュールを生成
  const schedules: { dueDate: Date; amount: number; status: string }[] = [];
  let y = input.startYear;
  let m = input.startMonth;
  while (y < input.endYear || (y === input.endYear && m <= input.endMonth)) {
    const dueDate = new Date(y, m - 1, input.dueDay);
    schedules.push({
      dueDate,
      amount: input.monthlyAmount,
      status: input.markPastAsPaid && dueDate < now ? "paid" : "unpaid",
    });
    m++;
    if (m > 12) {
      m = 1;
      y++;
    }
  }

  // 総額 = 月額 × 回数
  const totalAmount = input.monthlyAmount * schedules.length;

  await prisma.loan.create({
    data: {
      name: input.name,
      totalAmount,
      startDate,
      endDate,
      schedules: { create: schedules },
    },
  });

  revalidatePath("/loans");
}

type UpdateLoanInput = {
  id: number;
  name: string;
  monthlyAmount: number;
  dueDay: number;
  endYear: number;
  endMonth: number;
};

export async function updateLoan(input: UpdateLoanInput): Promise<void> {
  const session = await auth();
  if (!session?.user) throw new Error("未認証");

  const loan = await prisma.loan.findUniqueOrThrow({
    where: { id: input.id },
    include: { schedules: { orderBy: { dueDate: "asc" } } },
  });

  const newEndDate = new Date(input.endYear, input.endMonth - 1, 1);
  const currentEndYM =
    loan.endDate.getFullYear() * 12 + loan.endDate.getMonth();
  const newEndYM = input.endYear * 12 + (input.endMonth - 1);

  await prisma.$transaction(async (tx) => {
    // 1. 未払い分の月額・返済日を更新
    const unpaidSchedules = loan.schedules.filter((s) => s.status === "unpaid");
    for (const s of unpaidSchedules) {
      const d = new Date(s.dueDate);
      await tx.loanSchedule.update({
        where: { id: s.id },
        data: {
          amount: input.monthlyAmount,
          dueDate: new Date(d.getFullYear(), d.getMonth(), input.dueDay),
        },
      });
    }

    // 2. 終了月を延長する場合：スケジュールを追加
    if (newEndYM > currentEndYM) {
      const lastSchedule = loan.schedules[loan.schedules.length - 1];
      const lastDate = new Date(lastSchedule.dueDate);
      let y = lastDate.getFullYear();
      let m = lastDate.getMonth() + 2; // 翌月
      if (m > 12) { m = 1; y++; }
      while (y * 12 + (m - 1) <= newEndYM) {
        await tx.loanSchedule.create({
          data: {
            loanId: input.id,
            dueDate: new Date(y, m - 1, input.dueDay),
            amount: input.monthlyAmount,
            status: "unpaid",
          },
        });
        m++;
        if (m > 12) { m = 1; y++; }
      }
    }

    // 3. 終了月を短縮する場合：はみ出た未払いスケジュールを削除
    if (newEndYM < currentEndYM) {
      const cutoff = new Date(input.endYear, input.endMonth, 0, 23, 59, 59);
      await tx.loanSchedule.deleteMany({
        where: { loanId: input.id, status: "unpaid", dueDate: { gt: cutoff } },
      });
    }

    // 4. 総額を再計算してローン情報を更新
    const allSchedules = await tx.loanSchedule.findMany({
      where: { loanId: input.id },
    });
    const newTotalAmount = allSchedules.reduce((sum, s) => sum + s.amount, 0);

    await tx.loan.update({
      where: { id: input.id },
      data: { name: input.name, endDate: newEndDate, totalAmount: newTotalAmount },
    });
  });

  revalidatePath("/loans");
}

export async function deleteLoan(id: number): Promise<void> {
  const session = await auth();
  if (!session?.user) throw new Error("未認証");

  // LoanSchedule は onDelete: Cascade で自動削除される
  await prisma.loan.delete({ where: { id } });

  revalidatePath("/loans");
}

export async function toggleScheduleStatus(
  scheduleId: number,
  currentStatus: string
): Promise<void> {
  const session = await auth();
  if (!session?.user) throw new Error("未認証");

  const newStatus = currentStatus === "paid" ? "unpaid" : "paid";

  await prisma.loanSchedule.update({
    where: { id: scheduleId },
    data: { status: newStatus },
  });

  revalidatePath("/loans");
}
