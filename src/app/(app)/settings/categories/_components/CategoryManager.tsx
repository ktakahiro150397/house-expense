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
import { Pencil, Trash2, X, Check, Plus } from "lucide-react";
import {
  createCategory,
  updateCategory,
  deleteCategory,
  deleteCategoryRule,
} from "@/lib/actions/categories";
import type { Category, CategoryRule } from "@/generated/prisma/client";

type CategoryWithDetails = Category & {
  rules: CategoryRule[];
  _count: { transactions: number };
};

export default function CategoryManager({
  categories,
}: {
  categories: CategoryWithDetails[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // 追加フォーム
  const [newName, setNewName] = useState("");
  const [newSeq, setNewSeq] = useState("");

  // 編集中の行
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editSeq, setEditSeq] = useState("");

  function refresh() {
    router.refresh();
  }

  function handleCreate() {
    if (!newName.trim()) return;
    startTransition(async () => {
      await createCategory(newName.trim(), newSeq ? Number(newSeq) : undefined);
      setNewName("");
      setNewSeq("");
      refresh();
    });
  }

  function startEdit(cat: CategoryWithDetails) {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditSeq(String(cat.seq));
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName("");
    setEditSeq("");
  }

  function handleUpdate(id: number) {
    if (!editName.trim()) return;
    startTransition(async () => {
      await updateCategory(id, editName.trim(), Number(editSeq) || 0);
      setEditingId(null);
      refresh();
    });
  }

  function handleDelete(id: number, name: string) {
    if (!window.confirm(`カテゴリ「${name}」を削除しますか？`)) return;
    startTransition(async () => {
      try {
        await deleteCategory(id);
        refresh();
      } catch (e) {
        alert(e instanceof Error ? e.message : "削除に失敗しました");
      }
    });
  }

  function handleDeleteRule(id: number, keyword: string) {
    if (!window.confirm(`ルール「${keyword}」を削除しますか？`)) return;
    startTransition(async () => {
      await deleteCategoryRule(id);
      refresh();
    });
  }

  return (
    <div className="space-y-6">
      {/* 追加フォーム */}
      <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
        <div className="flex-1">
          <label className="text-sm font-medium mb-1 block">カテゴリ名</label>
          <Input
            placeholder="例: 食費"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            disabled={isPending}
          />
        </div>
        <div className="w-full sm:w-24">
          <label className="text-sm font-medium mb-1 block">順番</label>
          <Input
            type="number"
            placeholder="0"
            value={newSeq}
            onChange={(e) => setNewSeq(e.target.value)}
            disabled={isPending}
          />
        </div>
        <Button
          onClick={handleCreate}
          disabled={isPending || !newName.trim()}
          className="w-full sm:w-auto"
        >
          <Plus className="h-4 w-4 mr-1" />
          追加
        </Button>
      </div>

      {/* モバイル: カード形式 */}
      <div className="md:hidden space-y-2">
        {categories.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            カテゴリがありません
          </p>
        )}
        {categories.map((cat) => (
          <div key={cat.id} className="rounded-lg border bg-card p-3 space-y-2">
            {editingId === cat.id ? (
              <>
                <div className="flex gap-2">
                  <Input
                    className="flex-1 h-8 text-sm"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleUpdate(cat.id);
                      if (e.key === "Escape") cancelEdit();
                    }}
                    disabled={isPending}
                    autoFocus
                    placeholder="カテゴリ名"
                  />
                  <Input
                    type="number"
                    className="w-16 h-8 text-sm text-center"
                    value={editSeq}
                    onChange={(e) => setEditSeq(e.target.value)}
                    disabled={isPending}
                    placeholder="順番"
                  />
                </div>
                <div className="flex justify-end gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-green-600 hover:text-green-700"
                    onClick={() => handleUpdate(cat.id)}
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
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{cat.name}</span>
                    <span className="text-xs text-muted-foreground">
                      #{cat.seq}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {cat.rules.map((rule) => (
                      <Badge
                        key={rule.id}
                        variant="secondary"
                        className="gap-1 pr-1"
                      >
                        {rule.keyword}
                        <button
                          onClick={() =>
                            handleDeleteRule(rule.id, rule.keyword)
                          }
                          disabled={isPending}
                          className="hover:text-destructive disabled:opacity-50"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                    {cat.rules.length === 0 && (
                      <span className="text-xs text-muted-foreground">
                        ルールなし
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    明細 {cat._count.transactions} 件
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => startEdit(cat)}
                    disabled={isPending}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(cat.id, cat.name)}
                    disabled={isPending || cat._count.transactions > 0}
                    title={
                      cat._count.transactions > 0
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
              <TableHead className="w-16 text-center">順番</TableHead>
              <TableHead>カテゴリ名</TableHead>
              <TableHead className="whitespace-nowrap">自動分類ルール</TableHead>
              <TableHead className="text-center whitespace-nowrap">
                明細件数
              </TableHead>
              <TableHead className="text-center whitespace-nowrap">
                操作
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-muted-foreground py-8"
                >
                  カテゴリがありません
                </TableCell>
              </TableRow>
            )}
            {categories.map((cat) => (
              <TableRow key={cat.id}>
                {/* 順番 */}
                <TableCell className="text-center">
                  {editingId === cat.id ? (
                    <Input
                      type="number"
                      className="w-16 h-7 text-center text-sm"
                      value={editSeq}
                      onChange={(e) => setEditSeq(e.target.value)}
                      disabled={isPending}
                    />
                  ) : (
                    <span className="text-muted-foreground text-sm">
                      {cat.seq}
                    </span>
                  )}
                </TableCell>

                {/* カテゴリ名 */}
                <TableCell>
                  {editingId === cat.id ? (
                    <Input
                      className="h-7 text-sm"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleUpdate(cat.id);
                        if (e.key === "Escape") cancelEdit();
                      }}
                      disabled={isPending}
                      autoFocus
                    />
                  ) : (
                    <span className="font-medium">{cat.name}</span>
                  )}
                </TableCell>

                {/* ルール */}
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {cat.rules.map((rule) => (
                      <Badge
                        key={rule.id}
                        variant="secondary"
                        className="gap-1 pr-1"
                      >
                        {rule.keyword}
                        <button
                          onClick={() =>
                            handleDeleteRule(rule.id, rule.keyword)
                          }
                          disabled={isPending}
                          className="hover:text-destructive disabled:opacity-50"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                    {cat.rules.length === 0 && (
                      <span className="text-xs text-muted-foreground">
                        なし
                      </span>
                    )}
                  </div>
                </TableCell>

                {/* 明細件数 */}
                <TableCell className="text-center text-sm">
                  {cat._count.transactions}
                </TableCell>

                {/* 操作 */}
                <TableCell className="text-center">
                  <div className="flex justify-center gap-1">
                    {editingId === cat.id ? (
                      <>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-green-600 hover:text-green-700"
                          onClick={() => handleUpdate(cat.id)}
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
                          onClick={() => startEdit(cat)}
                          disabled={isPending}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(cat.id, cat.name)}
                          disabled={
                            isPending || cat._count.transactions > 0
                          }
                          title={
                            cat._count.transactions > 0
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
