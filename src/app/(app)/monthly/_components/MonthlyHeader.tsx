"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  year: number;
  month: number;
  dataSources: string;
};

function offsetMonth(year: number, month: number, delta: number) {
  const d = new Date(year, month - 1 + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

export default function MonthlyHeader({ year, month, dataSources }: Props) {
  const router = useRouter();

  function navigate(delta: number) {
    const { year: y, month: m } = offsetMonth(year, month, delta);
    const params = new URLSearchParams({ year: String(y), month: String(m) });
    if (dataSources) params.set("dataSources", dataSources);
    router.push(`/monthly?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="icon" onClick={() => navigate(-1)} aria-label="前月">
        <ChevronLeft className="size-4" />
      </Button>
      <span className="text-lg font-semibold min-w-[7rem] text-center">
        {year}年{month}月
      </span>
      <Button variant="outline" size="icon" onClick={() => navigate(1)} aria-label="次月">
        <ChevronRight className="size-4" />
      </Button>
    </div>
  );
}
