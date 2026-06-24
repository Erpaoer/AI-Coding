// 管理后台仪表盘 —— 统计卡片概览
// 展示：商品数 / 订单数 / 用户数 / 总营收

import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

export default async function AdminDashboardPage() {
  const [productCount, orderCount, userCount, revenueResult] =
    await Promise.all([
      prisma.product.count(),
      prisma.order.count(),
      prisma.user.count(),
      prisma.order.aggregate({
        _sum: { total: true },
        where: { status: { not: "CANCELLED" } },
      }),
    ]);

  const totalRevenue = revenueResult._sum.total ?? 0;

  const stats = [
    { label: "商品总数", value: productCount, icon: "📦", color: "bg-blue-50 text-blue-700" },
    { label: "订单总数", value: orderCount, icon: "📋", color: "bg-green-50 text-green-700" },
    { label: "用户总数", value: userCount, icon: "👤", color: "bg-purple-50 text-purple-700" },
    { label: "总营收", value: formatCurrency(totalRevenue), icon: "💰", color: "bg-orange-50 text-orange-700" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">📊 仪表盘</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-lg flex items-center justify-center text-xl ${stat.color}`}
                >
                  {stat.icon}
                </div>
                <div>
                  <p className="text-sm text-muted">{stat.label}</p>
                  <p className="text-2xl font-bold">
                    {typeof stat.value === "number"
                      ? stat.value.toLocaleString()
                      : stat.value}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 快捷入口 */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <a
          href="/admin/products"
          className="block p-4 border border-border rounded-lg hover:border-primary/30 hover:bg-muted-background/50 transition-colors"
        >
          <span className="text-lg mr-2">📦</span>
          <span className="font-medium">管理商品</span>
          <p className="text-sm text-muted mt-1">新增、编辑、下架商品</p>
        </a>
        <a
          href="/admin/orders"
          className="block p-4 border border-border rounded-lg hover:border-primary/30 hover:bg-muted-background/50 transition-colors"
        >
          <span className="text-lg mr-2">📋</span>
          <span className="font-medium">管理订单</span>
          <p className="text-sm text-muted mt-1">查看和处理所有订单</p>
        </a>
        <a
          href="/admin/categories"
          className="block p-4 border border-border rounded-lg hover:border-primary/30 hover:bg-muted-background/50 transition-colors"
        >
          <span className="text-lg mr-2">📂</span>
          <span className="font-medium">管理分类</span>
          <p className="text-sm text-muted mt-1">新增、编辑商品分类</p>
        </a>
      </div>
    </div>
  );
}
