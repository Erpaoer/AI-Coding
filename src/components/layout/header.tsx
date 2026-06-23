"use client";

// 顶栏 —— Logo + 导航 + 搜索入口 + 购物车徽标 + 用户菜单
// Phase 2 完善：登录状态切换显示

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function Header() {
  const pathname = usePathname();

  // 后台页面不显示前台 Header
  if (pathname.startsWith("/admin")) return null;

  const isActive = (path: string) => pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-border">
      <div className="container mx-auto max-w-7xl px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="text-xl font-bold text-primary">
          🛍️ Mini Mall
        </Link>

        {/* 导航 */}
        <nav className="hidden md:flex items-center gap-6 text-sm">
          <Link
            href="/"
            className={cn(
              "hover:text-primary transition-colors",
              isActive("/") && "text-primary font-medium"
            )}
          >
            首页
          </Link>
          <Link
            href="/search"
            className={cn(
              "hover:text-primary transition-colors",
              isActive("/search") && "text-primary font-medium"
            )}
          >
            搜索
          </Link>
        </nav>

        {/* 右侧操作 */}
        <div className="flex items-center gap-3">
          <Link
            href="/cart"
            className="relative text-sm hover:text-primary transition-colors"
          >
            🛒 购物车
          </Link>
          <Link
            href="/login"
            className="text-sm border border-border px-3 py-1.5 rounded-md hover:bg-muted-background transition-colors"
          >
            登录
          </Link>
          <Link
            href="/register"
            className="text-sm bg-primary text-white px-3 py-1.5 rounded-md hover:bg-primary-dark transition-colors"
          >
            注册
          </Link>
        </div>
      </div>
    </header>
  );
}
