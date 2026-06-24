"use client";

// 管理后台侧边栏导航
// 根据当前路径高亮激活项

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  icon: string;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/admin", icon: "📊", label: "仪表盘" },
  { href: "/admin/products", icon: "📦", label: "商品管理" },
  { href: "/admin/categories", icon: "📂", label: "分类管理" },
  { href: "/admin/orders", icon: "📋", label: "订单管理" },
];

export function AdminSidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  return (
    <aside className="w-60 min-h-screen bg-card border-r border-border flex flex-col shrink-0">
      {/* Logo */}
      <div className="h-14 flex items-center px-4 border-b border-border">
        <Link
          href="/admin"
          className="text-lg font-bold text-primary hover:text-primary-dark transition-colors"
        >
          🛍️ Mini Mall
        </Link>
      </div>

      {/* 导航菜单 */}
      <nav className="flex-1 p-3 space-y-1">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors",
              isActive(item.href)
                ? "bg-primary/10 text-primary font-medium"
                : "text-foreground hover:bg-muted-background"
            )}
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      {/* 底部：返回前台 */}
      <div className="p-3 border-t border-border">
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-muted hover:bg-muted-background transition-colors"
        >
          <span className="text-base">🏠</span>
          返回前台
        </Link>
      </div>
    </aside>
  );
}
