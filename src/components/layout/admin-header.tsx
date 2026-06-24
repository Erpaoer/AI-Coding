"use client";

// 管理后台顶栏：面包屑 + 用户信息 + 登出

import { usePathname } from "next/navigation";
import { LogoutButton } from "@/components/auth/logout-button";

interface AdminHeaderProps {
  userName?: string;
}

// 路径 → 中文标题映射
const TITLE_MAP: Record<string, string> = {
  "/admin": "仪表盘",
  "/admin/products": "商品管理",
  "/admin/categories": "分类管理",
  "/admin/orders": "订单管理",
};

export function AdminHeader({ userName }: AdminHeaderProps) {
  const pathname = usePathname();

  // 推导当前页面的中文标题
  let title = "管理后台";
  // 精确匹配优先，再尝试前缀匹配（如 /admin/products/xxx）
  if (TITLE_MAP[pathname]) {
    title = TITLE_MAP[pathname];
  } else {
    for (const [prefix, label] of Object.entries(TITLE_MAP)) {
      if (pathname.startsWith(prefix + "/") || pathname.startsWith(prefix + "?")) {
        title = label;
        break;
      }
    }
    // 特殊处理子页面
    if (pathname.startsWith("/admin/products/new")) title = "新增商品";
    else if (pathname.match(/^\/admin\/products\/\d+\/edit/)) title = "编辑商品";
    else if (pathname.match(/^\/admin\/orders\/\d+/)) title = "订单详情";
  }

  return (
    <header className="h-14 flex items-center justify-between px-6 border-b border-border bg-card shrink-0">
      {/* 左侧：面包屑 */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted">后台</span>
        <span className="text-muted">/</span>
        <span className="font-medium">{title}</span>
      </div>

      {/* 右侧：用户名 + 登出 */}
      <div className="flex items-center gap-3">
        {userName && (
          <span className="text-sm text-muted hidden sm:inline">{userName}</span>
        )}
        <LogoutButton />
      </div>
    </header>
  );
}
