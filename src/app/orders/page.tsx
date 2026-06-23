// 我的订单列表页 —— 需登录
// proxy.ts 守卫 /orders（未登录 → 302 /login），此处也有内联保护

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";

interface OrdersPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const userId = Number(user.sub);
  const { page: pageStr } = await searchParams;
  const page = Math.max(1, Number(pageStr) || 1);
  const limit = 10;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where: { userId },
      select: {
        id: true,
        status: true,
        originalTotal: true,
        discount: true,
        total: true,
        createdAt: true,
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.order.count({ where: { userId } }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">📋 我的订单</h1>

      {orders.length === 0 ? (
        <EmptyState
          icon="📋"
          title="暂无订单"
          description="快去挑选喜欢的商品吧"
          action={
            <Link href="/" className="text-primary hover:underline text-sm">
              去逛逛
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {/* 订单列表 */}
          <div className="space-y-3">
            {orders.map((order) => (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="block bg-card border border-border rounded-lg p-4 hover:border-primary/30 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted">订单 #{order.id}</span>
                  <OrderStatusBadge status={order.status} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted">
                    {order._count.items} 件商品
                    {order.discount < 1 && (
                      <span className="ml-2 text-xs line-through text-muted">
                        {formatCurrency(order.originalTotal)}
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-primary">
                      {formatCurrency(order.total)}
                    </span>
                  </div>
                </div>

                <div className="mt-2 text-xs text-muted">
                  {formatDate(order.createdAt)}
                </div>
              </Link>
            ))}
          </div>

          {/* 分页 */}
          {totalPages > 1 && (
            <div className="flex justify-center">
              <Pagination page={page} totalPages={totalPages} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
