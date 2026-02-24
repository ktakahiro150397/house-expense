"use client";

import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export default function CsvDownloadButton() {
  const searchParams = useSearchParams();

  function handleDownload() {
    const params = new URLSearchParams(searchParams.toString());
    const url = `/api/transactions/csv?${params.toString()}`;
    const a = document.createElement("a");
    a.href = url;
    a.download = "transactions.csv";
    a.click();
  }

  return (
    <Button variant="outline" size="sm" onClick={handleDownload}>
      <Download className="mr-1 h-4 w-4" />
      CSV出力
    </Button>
  );
}
