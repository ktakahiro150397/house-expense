"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Upload, List, Wallet, Building2, Settings, Database, Package, Bot, Palette } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { label: "ホーム", icon: Home, href: "/", implemented: true },
  { label: "CSVインポート", icon: Upload, href: "/import", implemented: true },
  { label: "明細一覧", icon: List, href: "/transactions", implemented: true },
  { label: "精算", icon: Wallet, href: "/settlement", implemented: true },
  { label: "ローン管理", icon: Building2, href: "/loans", implemented: true },
  { label: "カテゴリ管理", icon: Settings, href: "/settings/categories", implemented: true },
  { label: "データソース管理", icon: Database, href: "/settings/data-sources", implemented: true },
  { label: "品目追跡", icon: Package, href: "/items", implemented: true },
  { label: "AIアドバイス", icon: Bot, href: "/advice", implemented: true },
];

const adminLinks = [
  { label: "テーマ管理", icon: Palette, href: "/admin/themes", implemented: true },
];

export default function NavLinks({
  onNavigate,
  isAdmin = false,
}: {
  onNavigate?: () => void;
  isAdmin?: boolean;
}) {
  const pathname = usePathname();

  const renderLink = ({ label, icon: Icon, href, implemented }: (typeof links)[number]) => {
    const isActive = pathname === href;
    if (!implemented) {
      return (
        <span
          key={href}
          className="flex items-center gap-3 rounded-md px-3 py-3 text-sm text-muted-foreground cursor-not-allowed opacity-50"
        >
          <Icon className="h-5 w-5 shrink-0" />
          {label}
        </span>
      );
    }
    return (
      <Link
        key={href}
        href={href}
        onClick={onNavigate}
        className={cn(
          "flex items-center gap-3 rounded-md px-3 py-3 text-sm transition-colors hover:bg-accent hover:text-accent-foreground active:bg-accent",
          isActive
            ? "bg-accent text-accent-foreground font-medium"
            : "text-muted-foreground"
        )}
      >
        <Icon className="h-5 w-5 shrink-0" />
        {label}
      </Link>
    );
  };

  return (
    <nav className="flex-1 space-y-0.5 px-3 py-4">
      {links.map(renderLink)}
      {isAdmin && (
        <>
          <div className="my-1 border-t" />
          {adminLinks.map(renderLink)}
        </>
      )}
    </nav>
  );
}
