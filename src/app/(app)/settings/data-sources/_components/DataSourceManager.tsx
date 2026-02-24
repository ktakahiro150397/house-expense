"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pencil, Trash2, X, Check, Plus } from "lucide-react";
import {
  createDataSource,
  updateDataSource,
  deleteDataSource,
} from "@/lib/actions/data-sources";
import type { DataSource } from "@/generated/prisma/client";

type DataSourceWithCount = DataSource & {
  _count: { transactions: number };
};

const TYPE_OPTIONS = [
  { value: "card", label: "カード" },
  { value: "bank", label: "銀行口座" },
];

function TypeBadge({ type }: { type: string }) {
  if (type === "card") return <Badge variant="secondary">カード</Badge>;
  return <Badge variant="outline">銀行口座</Badge>;
}

export default function DataSourceManager({
  dataSources,
}: {
  dataSources: DataSourceWithCount[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // 追加フォーム
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<string>("card");
  const [newInstitution, setNewInstitution] = useState("");

  // 編集中の行
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState<string>("card");
  const [editInstitution, setEditInstitution] = useState("");

  function refresh() {
    router.refresh();
  }

  function handleCreate() {
    if (!newName.trim()) return;
    startTransition(async () => {
      await createDataSource(newName.trim(), newType, newInstitution || undefined);
      setNewName("");
      setNewType("card");
      setNewInstitution("");
      refresh();
    });
  }

  function startEdit(ds: DataSourceWithCount) {
    setEditingId(ds.id);
    setEditName(ds.name);
    setEditType(ds.type);
    setEditInstitution(ds.institution ?? "");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName("");
    setEditType("card");
    setEditInstitution("");
  }

  function handleUpdate(id: number) {
    if (!editName.trim()) return;
    startTransition(async () => {
      await updateDataSource(id, editName.trim(), editType, editInstitution || undefined);
      setEditingId(null);
      refresh();
    });
  }

  function handleDelete(id: number, name: string) {
    if (!window.confirm(`データソース「${name}」を削除しますか？`)) return;
    startTransition(async () => {
      try {
        await deleteDataSource(id);
        refresh();
      } catch (e) {
        alert(e instanceof Error ? e.message : "削除に失敗しました");
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* 追加フォーム */}
      <div className="flex flex-col gap-2 sm:grid sm:grid-cols-2 lg:flex lg:flex-row lg:items-end">
        <div className="sm:col-span-1">
          <label className="text-sm font-medium mb-1 block">名前</label>
          <Input
            placeholder="例: 個人カード"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            disabled={isPending}
          />
        </div>
        <div className="sm:col-span-1">
          <label className="text-sm font-medium mb-1 block">種別</label>
          <Select value={newType} onValueChange={setNewType} disabled={isPending}>
            <SelectTrigger className="w-full lg:w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TYPE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="sm:col-span-1">
          <label className="text-sm font-medium mb-1 block">発行元（任意）</label>
          <Input
            placeholder="例: 三井住友"
            value={newInstitution}
            onChange={(e) => setNewInstitution(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            disabled={isPending}
            className="w-full lg:w-44"
          />
        </div>
        <Button
          onClick={handleCreate}
          disabled={isPending || !newName.trim()}
          className="w-full sm:col-span-1 lg:w-auto"
        >
          <Plus className="h-4 w-4 mr-1" />
          追加
        </Button>
      </div>

      {/* モバイル: カード形式 */}
      <div className="md:hidden space-y-2">
        {dataSources.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            データソースがありません
          </p>
        )}
        {dataSources.map((ds) => (
          <div key={ds.id} className="rounded-lg border bg-card p-3 space-y-2">
            {editingId === ds.id ? (
              <>
                <div className="space-y-2">
                  <Input
                    className="h-8 text-sm"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleUpdate(ds.id);
                      if (e.key === "Escape") cancelEdit();
                    }}
                    disabled={isPending}
                    autoFocus
                    placeholder="名前"
                  />
                  <div className="flex gap-2">
                    <Select
                      value={editType}
                      onValueChange={setEditType}
                      disabled={isPending}
                    >
                      <SelectTrigger className="h-8 flex-1 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TYPE_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      className="h-8 flex-1 text-sm"
                      value={editInstitution}
                      onChange={(e) => setEditInstitution(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleUpdate(ds.id);
                        if (e.key === "Escape") cancelEdit();
                      }}
                      placeholder="発行元（任意）"
                      disabled={isPending}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-green-600 hover:text-green-700"
                    onClick={() => handleUpdate(ds.id)}
                    disabled={isPending}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    保存
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={cancelEdit}
                    disabled={isPending}
                  >
                    <X className="h-4 w-4 mr-1" />
                    キャンセル
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{ds.name}</span>
                    <TypeBadge type={ds.type} />
                  </div>
                  {ds.institution && (
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {ds.institution}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    明細 {ds._count.transactions} 件
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => startEdit(ds)}
                    disabled={isPending}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(ds.id, ds.name)}
                    disabled={isPending || ds._count.transactions > 0}
                    title={
                      ds._count.transactions > 0
                        ? "明細が存在するため削除できません"
                        : "削除"
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* デスクトップ: テーブル形式 */}
      <div className="hidden md:block rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>名前</TableHead>
              <TableHead className="whitespace-nowrap">種別</TableHead>
              <TableHead className="whitespace-nowrap">発行元</TableHead>
              <TableHead className="text-center whitespace-nowrap">
                明細件数
              </TableHead>
              <TableHead className="text-center whitespace-nowrap">
                操作
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dataSources.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-muted-foreground py-8"
                >
                  データソースがありません
                </TableCell>
              </TableRow>
            )}
            {dataSources.map((ds) => (
              <TableRow key={ds.id}>
                {/* 名前 */}
                <TableCell>
                  {editingId === ds.id ? (
                    <Input
                      className="h-7 text-sm"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleUpdate(ds.id);
                        if (e.key === "Escape") cancelEdit();
                      }}
                      disabled={isPending}
                      autoFocus
                    />
                  ) : (
                    <span className="font-medium">{ds.name}</span>
                  )}
                </TableCell>

                {/* 種別 */}
                <TableCell>
                  {editingId === ds.id ? (
                    <Select
                      value={editType}
                      onValueChange={setEditType}
                      disabled={isPending}
                    >
                      <SelectTrigger className="h-7 w-28 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TYPE_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <TypeBadge type={ds.type} />
                  )}
                </TableCell>

                {/* 発行元 */}
                <TableCell>
                  {editingId === ds.id ? (
                    <Input
                      className="h-7 text-sm w-36"
                      value={editInstitution}
                      onChange={(e) => setEditInstitution(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleUpdate(ds.id);
                        if (e.key === "Escape") cancelEdit();
                      }}
                      placeholder="任意"
                      disabled={isPending}
                    />
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      {ds.institution ?? "—"}
                    </span>
                  )}
                </TableCell>

                {/* 明細件数 */}
                <TableCell className="text-center text-sm">
                  {ds._count.transactions}
                </TableCell>

                {/* 操作 */}
                <TableCell className="text-center">
                  <div className="flex justify-center gap-1">
                    {editingId === ds.id ? (
                      <>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-green-600 hover:text-green-700"
                          onClick={() => handleUpdate(ds.id)}
                          disabled={isPending}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={cancelEdit}
                          disabled={isPending}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => startEdit(ds)}
                          disabled={isPending}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(ds.id, ds.name)}
                          disabled={
                            isPending || ds._count.transactions > 0
                          }
                          title={
                            ds._count.transactions > 0
                              ? "明細が存在するため削除できません"
                              : "削除"
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
