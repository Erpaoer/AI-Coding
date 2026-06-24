// 管理员订单详情页 —— 含用户信息 + 商品明细 + 金额明细 + 状态操作
// Server Component

import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { AdminOrderActions } from "@/components/admin/admin-order-actions";
import { formatCurrency, formatDate } from "@/lib/utils";
import { MEMBERSHIP_LEVELS, ORDER_STATUS_LABELS } from "@/lib/constants";

interface AdminOrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminOrderDetailPage({
  params,
}: AdminOrderDetailPageProps) {
  const { id: idStr } = await params;
  const id = Number(idStr);

  if (isNaN(id)) notFound();

  const order = await prisma.order.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      originalTotal: true,
      discount: true,
      total: true,
      createdAt: true,
      updatedAt: true,
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          membershipLevel: true,
          totalSpent: true,
        },
      },
      items: {
        select: {
          id: true,
          quantity: true,
          price: true,
          product: {
            select: { id: true, name: true, slug: true, imageUrl: true },
          },
        },
      },
    },
  });

  if (!order) notFound();

  const discountPercent = Math.round((1 - order.discount) * 100);
  const currentLevel = MEMBERSHIP_LEVELS.find(
    (ml) => ml.discount === order.discount
  );
  const userLevel = MEMBERSHIP_LEVELS[order.user.membershipLevel];

  return (
    <div>
      {/* 返回链接 */}
      <Link
        href="/admin/orders"
        className="text-sm text-muted hover:text-primary transition-colors mb-4 inline-block"
      >
        ← 返回订单列表
      </Link>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">订单 #{order.id}</h1>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 左侧：订单详情 */}
        <div className="lg:col-span-2 space-y-4">
          {/* 状态操作 */}
          <Card>
            <CardHeader>
              <h2 className="font-medium">订单操作</h2>
            </CardHeader>
            <CardContent>
              <AdminOrderActions
                orderId={order.id}
                currentStatus={order.status}
              />
            </CardContent>
          </Card>

          {/* 商品明细 */}
          <Card>
            <CardHeader>
              <h2 className="font-medium">商品明细</h2>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-border">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 py-3 first:pt-0 last:pb-0"
                  >
                    {/* 图片 */}
                    <Link
                      href={`/products/${item.product.slug}`}
                      className="shrink-0"
                      target="_blank"
                    >
                      <div className="w-16 h-16 bg-muted-background rounded-md border border-border flex items-center justify-center overflow-hidden">
                        {item.product.imageUrl ? (
                          <img
                            src={item.product.imageUrl}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-xl">📦</span>
                        )}
                      </div>
                    </Link>

                    {/* 信息 */}
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/products/${item.product.slug}`}
                        className="font-medium text-sm hover:text-primary transition-colors line-clamp-1"
                        target="_blank"
                      >
                        {item.product.name}
                      </Link>
                      <p className="text-sm text-muted mt-0.5">
                        {formatCurrency(item.price)} × {item.quantity}
                      </p>
                    </div>

                    <span className="text-sm font-medium shrink-0">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 金额明细 */}
          <Card>
            <CardHeader>
              <h2 className="font-medium">金额明细</h2>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted">商品原价</span>
                  <span>{formatCurrency(order.originalTotal)}</span>
                </div>

                {order.discount < 1 && (
                  <div className="flex justify-between">
                    <span className="text-muted">
                      会员折扣
                      {currentLevel && (
                        <span className="ml-1 text-xs">
                          ({currentLevel.name} {discountPercent}% off)
                        </span>
                      )}
                    </span>
                    <span className="text-success">
                      -{formatCurrency(order.originalTotal - order.total)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between border-t border-border pt-2 font-bold text-base">
                  <span>实付金额</span>
                  <span className="text-danger">{formatCurrency(order.total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 时间信息 */}
          <Card>
            <CardContent className="text-sm text-muted space-y-1">
              <p>下单时间：{formatDate(order.createdAt)}</p>
              <p>最近更新：{formatDate(order.updatedAt)}</p>
            </CardContent>
          </Card>
        </div>

        {/* 右侧：用户信息 */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <h2 className="font-medium">用户信息</h2>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-muted text-xs">姓名</p>
                <p className="font-medium">{order.user.name}</p>
              </div>
              <div>
                <p className="text-muted text-xs">邮箱</p>
                <p>{order.user.email}</p>
              </div>
              <div>
                <p className="text-muted text-xs">会员等级</p>
                <Badge variant="info">
                  {userLevel?.name || `等级 ${order.user.membershipLevel}`}
                </Badge>
              </div>
              <div>
                <p className="text-muted text-xs">累计消费</p>
                <p className="font-medium">
                  {formatCurrency(order.user.totalSpent)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 订单状态信息 */}
          <Card>
            <CardHeader>
              <h2 className="font-medium">状态流转</h2>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {(["PENDING", "PAID", "SHIPPED", "COMPLETED"] as const).map(
                  (s, idx) => {
                    // 当前状态之前的所有状态标记为已完成
                    const statusOrder = ["PENDING", "PAID", "SHIPPED", "COMPLETED"];
                    const isDone =
                      order.status !== "CANCELLED" &&
                      statusOrder.indexOf(order.status) > idx;

                    return (
                      <div
                        key={s}
                        className="flex items-center gap-2 text-sm"
                      >
                        <span
                          className={`w-3 h-3 rounded-full border-2 ${
                            order.status === s
                              ? "bg-primary border-primary"
                              : isDone
                              ? "bg-success border-success"
                              : "bg-transparent border-muted"
                          }`}
                        />
                        <span
                          className={
                            order.status === s ? "font-medium" : "text-muted"
                          }
                        >
                          {ORDER_STATUS_LABELS[s]}
                          {isDone && order.status !== s && " ✓"}
                        </span>
                      </div>
                    );
                  }
                )}
                {order.status === "CANCELLED" && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="w-3 h-3 rounded-full border-2 bg-danger border-danger" />
                    <span className="font-medium text-danger">
                      {ORDER_STATUS_LABELS.CANCELLED}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
