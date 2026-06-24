// 订单管理列表页 —— 全部订单（含用户信息）+ 状态筛选 + 分页
// Server Component

import Link from "next/link";
import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ORDER_STATUSES, ORDER_STATUS_LABELS, PAGINATION_DEFAULTS } from "@/lib/constants";
import { OrderStatusFilter } from "./order-status-filter";

interface AdminOrdersPageProps {
  searchParams: Promise<{
    status?: string;
    page?: string;
  }>;
}

export default async function AdminOrdersPage({
  searchParams,
}: AdminOrdersPageProps) {
  const params = await searchParams;
  const status = params.status || undefined;
  const page = Math.max(1, Number(params.page) || 1);
  const limit = PAGINATION_DEFAULTS.ADMIN_PAGE_SIZE;

  // 构建查询条件
  const where: Record<string, unknown> = {};
  if (status && (ORDER_STATUSES as readonly string[]).includes(status)) {
    where.status = status;
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      select: {
        id: true,
        status: true,
        originalTotal: true,
        discount: true,
        total: true,
        createdAt: true,
        user: {
          select: { id: true, email: true, name: true },
        },
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.order.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  // 各状态订单数统计
  const statusCounts = await Promise.all(
    ORDER_STATUSES.map(async (s) => ({
      status: s,
      count: await prisma.order.count({ where: { status: s } }),
    }))
  );

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">📋 订单管理</h1>

      {/* 状态筛选标签 */}
      <OrderStatusFilter
        currentStatus={status}
        statusCounts={statusCounts}
      />

      {/* 订单表格 */}
      <Card>
        <CardContent className="p-0">
          {orders.length === 0 ? (
            <div className="py-8">
              <EmptyState
                icon="📋"
                title={status ? `没有「${ORDER_STATUS_LABELS[status] || status}」状态的订单` : "暂无订单"}
                description={status ? "尝试切换其他状态筛选" : "用户下单后将在此显示"}
              />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted-background/50">
                      <th className="text-left py-3 px-4 font-medium text-muted">订单号</th>
                      <th className="text-left py-3 px-4 font-medium text-muted">用户</th>
                      <th className="text-center py-3 px-4 font-medium text-muted">状态</th>
                      <th className="text-right py-3 px-4 font-medium text-muted">件数</th>
                      <th className="text-right py-3 px-4 font-medium text-muted">金额</th>
                      <th className="text-right py-3 px-4 font-medium text-muted hidden md:table-cell">下单时间</th>
                      <th className="text-right py-3 px-4 font-medium text-muted">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr
                        key={order.id}
                        className="border-b border-border last:border-0 hover:bg-muted-background/30 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <span className="font-mono text-xs">#{order.id}</span>
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-sm">{order.user.name}</p>
                            <p className="text-xs text-muted">{order.user.email}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <OrderStatusBadge status={order.status} />
                        </td>
                        <td className="py-3 px-4 text-right text-muted">
                          {order._count.items}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div>
                            <span className="font-medium">
                              {formatCurrency(order.total)}
                            </span>
                            {order.discount < 1 && (
                              <span className="text-xs text-muted line-through block">
                                {formatCurrency(order.originalTotal)}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right text-muted hidden md:table-cell text-xs">
                          {formatDate(order.createdAt)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="text-primary hover:underline text-sm"
                          >
                            查看详情
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 统计信息 */}
              <div className="px-4 py-3 border-t border-border text-sm text-muted">
                共 {total} 个订单
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="mt-4 flex justify-center">
          <Pagination page={page} totalPages={totalPages} />
        </div>
      )}
    </div>
  );
}
