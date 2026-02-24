"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Settings, GripVertical, EyeOff, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ---- ウィジェット定義 ----
export type WidgetId =
  | "monthly-summary"
  | "category-chart"
  | "month-comparison"
  | "income-expense"
  | "shared-expense"
  | "unsettled"
  | "upcoming-loan"
  | "datasource-chart"
  | "weekly-trend"
  | "cumulative-spending"
  | "category-comparison"
  | "top-items"
  | "datasource-comparison"
  | "month-end-projection";

type WidgetMeta = {
  id: WidgetId;
  label: string;
  defaultEnabled: boolean;
};

const WIDGET_REGISTRY: WidgetMeta[] = [
  { id: "monthly-summary",       label: "月別支出推移",    defaultEnabled: true  },
  { id: "category-chart",        label: "カテゴリ別支出",  defaultEnabled: true  },
  { id: "month-comparison",      label: "前月比較",        defaultEnabled: true  },
  { id: "income-expense",        label: "収支バランス",    defaultEnabled: true  },
  { id: "shared-expense",        label: "共有費サマリー",  defaultEnabled: true  },
  { id: "unsettled",             label: "未精算金額",      defaultEnabled: true  },
  { id: "upcoming-loan",         label: "ローン返済",      defaultEnabled: true  },
  { id: "datasource-chart",      label: "決済手段別支出",  defaultEnabled: true  },
  { id: "weekly-trend",          label: "週別支出",        defaultEnabled: false },
  { id: "cumulative-spending",   label: "累計支出カーブ",  defaultEnabled: false },
  { id: "category-comparison",   label: "カテゴリ前月比",  defaultEnabled: false },
  { id: "top-items",             label: "支出上位品目",    defaultEnabled: false },
  { id: "datasource-comparison", label: "決済手段前月比",  defaultEnabled: false },
  { id: "month-end-projection",  label: "月末着地予測",    defaultEnabled: false },
];

const DEFAULT_ENABLED = WIDGET_REGISTRY.filter((w) => w.defaultEnabled).map((w) => w.id);
const DEFAULT_ORDER   = WIDGET_REGISTRY.map((w) => w.id);
const STORAGE_KEY     = "dashboard-widget-config-v1";

// ---- 永続化スキーマ ----
type StoredConfig = {
  enabled: WidgetId[];
  order:   WidgetId[];
};

function loadConfig(): StoredConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as StoredConfig;
      const validIds = new Set(WIDGET_REGISTRY.map((w) => w.id));
      const savedOrder   = parsed.order.filter((id) => validIds.has(id as WidgetId)) as WidgetId[];
      const unsaved      = DEFAULT_ORDER.filter((id) => !savedOrder.includes(id));
      return {
        enabled: (parsed.enabled as WidgetId[]).filter((id) => validIds.has(id)),
        order:   [...savedOrder, ...unsaved],
      };
    }
  } catch { /* ignore */ }
  return { enabled: DEFAULT_ENABLED, order: DEFAULT_ORDER };
}

// ---- Props ----
type Props = {
  widgets: Partial<Record<WidgetId, React.ReactNode>>;
};

// ---- Component ----
export default function DashboardClientLayout({ widgets }: Props) {
  const [config, setConfig] = useState<StoredConfig>({
    enabled: DEFAULT_ENABLED,
    order:   DEFAULT_ORDER,
  });
  const [isCustomizing, setIsCustomizing] = useState(false);

  // localStorage から読み込み（SSR ハイドレーション後）
  useEffect(() => {
    setConfig(loadConfig());
  }, []);

  // 変更を localStorage に保存
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  }, [config]);

  // ---- toggle ----
  const toggleWidget = useCallback((id: WidgetId) => {
    setConfig((prev) => ({
      ...prev,
      enabled: prev.enabled.includes(id)
        ? prev.enabled.filter((e) => e !== id)
        : [...prev.enabled, id],
    }));
  }, []);

  // ---- drag & drop ----
  const dragId    = useRef<WidgetId | null>(null);
  const dragOverId = useRef<WidgetId | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<WidgetId | null>(null);

  const handleDragStart = useCallback((_e: React.DragEvent, id: WidgetId) => {
    dragId.current = id;
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, id: WidgetId) => {
    e.preventDefault();
    if (dragOverId.current !== id) {
      dragOverId.current = id;
      setDragOverTarget(id);
    }
  }, []);

  const handleDragLeave = useCallback(() => {
    dragOverId.current = null;
    setDragOverTarget(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetId: WidgetId) => {
    e.preventDefault();
    const sourceId = dragId.current;
    if (!sourceId || sourceId === targetId) return;

    setConfig((prev) => {
      const newOrder = [...prev.order];
      const fromIdx  = newOrder.indexOf(sourceId);
      const toIdx    = newOrder.indexOf(targetId);
      if (fromIdx === -1 || toIdx === -1) return prev;
      newOrder.splice(fromIdx, 1);
      newOrder.splice(toIdx, 0, sourceId);
      return { ...prev, order: newOrder };
    });

    dragId.current    = null;
    dragOverId.current = null;
    setDragOverTarget(null);
  }, []);

  const handleDragEnd = useCallback(() => {
    dragId.current    = null;
    dragOverId.current = null;
    setDragOverTarget(null);
  }, []);

  // 表示するウィジェット（order 順 → enabled かつ widgets に定義済み）
  const visibleIds = config.order.filter(
    (id) => config.enabled.includes(id) && widgets[id] != null
  );

  // カスタマイズパネル用：order 順で全ウィジェット
  const allOrderedIds = config.order.filter((id) => widgets[id] != null);

  return (
    <div className="space-y-4">
      {/* カスタマイズボタン */}
      <div className="flex justify-end">
        <Button
          variant={isCustomizing ? "default" : "outline"}
          size="sm"
          onClick={() => setIsCustomizing((v) => !v)}
          className="gap-2"
        >
          {isCustomizing ? (
            <>
              <Check className="h-4 w-4" />
              完了
            </>
          ) : (
            <>
              <Settings className="h-4 w-4" />
              カスタマイズ
            </>
          )}
        </Button>
      </div>

      {/* カスタマイズパネル */}
      {isCustomizing && (
        <div className="rounded-lg border bg-muted/40 p-4 space-y-3">
          <div>
            <p className="text-sm font-medium mb-2">表示するウィジェット</p>
            <div className="flex flex-wrap gap-2">
              {WIDGET_REGISTRY.map((w) => {
                const enabled = config.enabled.includes(w.id);
                const available = widgets[w.id] != null;
                return (
                  <button
                    key={w.id}
                    onClick={() => available && toggleWidget(w.id)}
                    disabled={!available}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-colors",
                      enabled && available
                        ? "bg-orange-500 text-white border-orange-500"
                        : available
                          ? "bg-background text-muted-foreground border-border hover:border-foreground"
                          : "bg-background text-muted-foreground/40 border-border cursor-not-allowed"
                    )}
                  >
                    {enabled && available ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <EyeOff className="h-3 w-3" />
                    )}
                    {w.label}
                  </button>
                );
              })}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            ウィジェットをドラッグして並び順を変更できます
          </p>
        </div>
      )}

      {/* ウィジェットグリッド */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(isCustomizing ? allOrderedIds : visibleIds).map((id) => {
          const enabled  = config.enabled.includes(id);
          const isDragOver = isCustomizing && dragOverTarget === id;

          return (
            <div
              key={id}
              draggable={isCustomizing}
              onDragStart={isCustomizing ? (e) => handleDragStart(e, id) : undefined}
              onDragOver={isCustomizing  ? (e) => handleDragOver(e, id)  : undefined}
              onDragLeave={isCustomizing  ? handleDragLeave                : undefined}
              onDrop={isCustomizing      ? (e) => handleDrop(e, id)      : undefined}
              onDragEnd={isCustomizing   ? handleDragEnd                  : undefined}
              className={cn(
                "relative transition-all",
                isCustomizing && "cursor-grab active:cursor-grabbing",
                isCustomizing && !enabled && "opacity-40",
                isDragOver && "ring-2 ring-orange-400 rounded-xl"
              )}
            >
              {/* カスタマイズモード時のオーバーレイ */}
              {isCustomizing && (
                <div className="absolute top-2 right-2 z-10 flex gap-1">
                  <span className="bg-background/90 border rounded-md p-1 shadow-sm select-none">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                  </span>
                  <button
                    onClick={() => toggleWidget(id)}
                    className={cn(
                      "bg-background/90 border rounded-md p-1 shadow-sm hover:bg-muted transition-colors",
                      enabled ? "text-muted-foreground" : "text-orange-500"
                    )}
                    title={enabled ? "非表示にする" : "表示する"}
                  >
                    {enabled ? (
                      <X className="h-4 w-4" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                  </button>
                </div>
              )}

              {widgets[id]}
            </div>
          );
        })}
      </div>
    </div>
  );
}
