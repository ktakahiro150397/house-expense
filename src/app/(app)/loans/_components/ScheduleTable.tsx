"use client";

import { useTransition } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { LoanSchedule } from "@/generated/prisma/client";
import { toggleScheduleStatus } from "@/lib/actions/loans";
import { cn } from "@/lib/utils";

function formatDate(d: Date): string {
  const date = new Date(d);
  return `${date.getFullYear()}年${String(date.getMonth() + 1).padStart(2, "0")}月${String(date.getDate()).padStart(2, "0")}日`;
}

export default function ScheduleTable({
  schedules,
}: {
  schedules: LoanSchedule[];
}) {
  const [isPending, startTransition] = useTransition();

  function handleToggle(scheduleId: number, currentStatus: string) {
    startTransition(async () => {
      await toggleScheduleStatus(scheduleId, currentStatus);
    });
  }

  return (
    <div className="overflow-x-auto border-t">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="whitespace-nowrap">返済日</TableHead>
            <TableHead className="text-right whitespace-nowrap">金額</TableHead>
            <TableHead className="text-center whitespace-nowrap">
              ステータス
            </TableHead>
            <TableHead className="text-center whitespace-nowrap">
              支払済
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {schedules.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={4}
                className="text-center text-muted-foreground py-8"
              >
                返済スケジュールがありません
              </TableCell>
            </TableRow>
          )}
          {schedules.map((schedule) => (
            <TableRow
              key={schedule.id}
              className={cn(schedule.status === "paid" && "opacity-40")}
            >
              <TableCell className="whitespace-nowrap text-sm">
                {formatDate(schedule.dueDate)}
              </TableCell>
              <TableCell className="text-right whitespace-nowrap text-sm font-mono">
                ¥{schedule.amount.toLocaleString()}
              </TableCell>
              <TableCell className="text-center">
                {schedule.status === "paid" ? (
                  <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">
                    支払済
                  </Badge>
                ) : (
                  <Badge variant="outline">未払い</Badge>
                )}
              </TableCell>
              <TableCell className="text-center">
                <input
                  type="checkbox"
                  checked={schedule.status === "paid"}
                  disabled={isPending}
                  onChange={() => handleToggle(schedule.id, schedule.status)}
                  className="h-4 w-4 cursor-pointer accent-green-600 disabled:cursor-not-allowed"
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
