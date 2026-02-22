"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Upload, List, Wallet, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { label: "ホーム", icon: Home, href: "/", implemented: true },
  { label: "CSVインポート", icon: Upload, href: "/import", implemented: true },
  { label: "明細一覧", icon: List, href: "/transactions", implemented: true },
  { label: "精算", icon: Wallet, href: "/settlement", implemented: false },
  { label: "ローン管理", icon: Building2, href: "/loans", implemented: false },
];

export default function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex-1 space-y-1 px-3 py-4">
      {links.map(({ label, icon: Icon, href, implemented }) => {
        const isActive = pathname === href;
        if (!implemented) {
          return (
            <span
              key={href}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground cursor-not-allowed opacity-50"
            >
              <Icon className="h-4 w-4" />
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
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
              isActive
                ? "bg-accent text-accent-foreground font-medium"
                : "text-muted-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
