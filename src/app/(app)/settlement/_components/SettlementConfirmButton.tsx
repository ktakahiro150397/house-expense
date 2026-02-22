"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { finalizeSettlement } from "@/lib/actions/settlement";

export default function SettlementConfirmButton() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleClick() {
    if (!window.confirm("精算を確定しますか？\n未精算の共有支出すべてに精算日が記録されます。")) {
      return;
    }
    startTransition(async () => {
      await finalizeSettlement();
      router.refresh();
    });
  }

  return (
    <div className="flex justify-end">
      <Button
        onClick={handleClick}
        disabled={isPending}
        size="lg"
        className="min-w-40"
      >
        {isPending ? "処理中..." : "精算を確定する"}
      </Button>
    </div>
  );
}
