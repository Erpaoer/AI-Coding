"use client";

// 页脚 —— 版权信息
// 后台管理页面不显示页脚

import { usePathname } from "next/navigation";

export function Footer() {
  const pathname = usePathname();

  // 后台页面不显示 Footer
  if (pathname.startsWith("/admin")) return null;

  return (
    <footer className="border-t border-border bg-muted-background">
      <div className="container mx-auto max-w-7xl px-4 py-6 text-center text-sm text-muted">
        <p>&copy; {new Date().getFullYear()} Mini Mall. 基于 Next.js 16 构建的全栈电商学习项目。</p>
      </div>
    </footer>
  );
}
