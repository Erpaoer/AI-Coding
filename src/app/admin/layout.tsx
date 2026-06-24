// 管理后台布局：左侧导航 + 顶栏 + 内容区
// 双重认证保护：proxy.ts 守卫 + 此处服务端再次验证
//
// 注意：根 layout 的 Header 在 /admin 路由下自动隐藏（pathname 检测），
// 但 Footer 仍然显示。可通过修改 Footer 或在此处不使用根 layout 解决。
// Next.js App Router 不支持嵌套 layout 替换父 layout，因此我们接受此行为。
// 如需隐藏 Footer，请将 Footer 改为 client component 并检测 /admin 路径。

import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { AdminHeader } from "@/components/layout/admin-header";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 服务端再次校验 ADMIN 角色（proxy.ts 已做第一道防护）
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/");

  return (
    <div className="flex min-h-screen">
      {/* 左侧导航 */}
      <AdminSidebar />

      {/* 右侧内容区 */}
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader userName={user.name} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
