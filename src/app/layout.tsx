// 根布局 —— 所有页面共享的 HTML 结构 + Header + Footer
// async 布局：服务端获取当前用户信息，传给 Header 避免客户端额外请求

import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Mini Mall - 微型电商",
  description: "一个基于 Next.js 16 的全栈微型电商项目",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 服务端获取当前登录用户（null = 未登录）
  const user = await getCurrentUser();

  return (
    <html lang="zh-CN">
      <body className="min-h-screen flex flex-col bg-background text-foreground">
        <Header user={user} />
        <main className="flex-1 container mx-auto px-4 py-6 max-w-7xl">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
