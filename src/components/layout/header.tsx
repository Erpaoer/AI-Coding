"use client";

// 顶栏 —— Logo + 导航 + 搜索入口 + 购物车徽标 + 用户菜单
// 接收服务端传入的 user 对象，根据登录状态切换显示

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LogoutButton } from "@/components/auth/logout-button";
import { CartBadge } from "@/components/cart/cart-badge";

interface HeaderUser {
  sub: string;
  email: string;
  name: string;
  role: string;
}

interface HeaderProps {
  user: HeaderUser | null;
}

export function Header({ user }: HeaderProps) {
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
          {user?.role === "ADMIN" && (
            <Link
              href="/admin"
              className={cn(
                "hover:text-primary transition-colors",
                isActive("/admin") && "text-primary font-medium"
              )}
            >
              后台管理
            </Link>
          )}
        </nav>

        {/* 右侧操作 */}
        <div className="flex items-center gap-3">
          {/* 购物车 */}
          <Link
            href="/cart"
            className="relative text-sm hover:text-primary transition-colors"
          >
            🛒 购物车
            <CartBadge />
          </Link>

          {user ? (
            /* 已登录：用户名 + 退出按钮 */
            <>
              <Link
                href="/orders"
                className="text-sm hover:text-primary transition-colors"
              >
                📋 我的订单
              </Link>
              <span className="text-sm text-muted hidden sm:inline">
                {user.name}
              </span>
              <LogoutButton />
            </>
          ) : (
            /* 未登录：登录 + 注册链接 */
            <>
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
            </>
          )}
        </div>
      </div>
    </header>
  );
}
