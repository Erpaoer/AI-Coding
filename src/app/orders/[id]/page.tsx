// 订单详情页 —— 需登录 + 限本人订单
// 展示：商品明细、金额明细、状态、操作按钮

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { OrderActions } from "@/components/orders/order-actions";
import { formatCurrency, formatDate } from "@/lib/utils";
import { MEMBERSHIP_LEVELS } from "@/lib/constants";

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const userId = Number(user.sub);
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
      userId: true,
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
  if (order.userId !== userId) {
    redirect("/orders");
  }

  // 折扣信息
  const discountPercent = Math.round((1 - order.discount) * 100);
  const currentLevel = MEMBERSHIP_LEVELS.find((ml) => ml.discount === order.discount);

  return (
    <div className="max-w-3xl mx-auto">
      {/* 返回链接 */}
      <Link
        href="/orders"
        className="text-sm text-muted hover:text-primary transition-colors mb-4 inline-block"
      >
        ← 返回订单列表
      </Link>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">订单 #{order.id}</h1>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="space-y-4">
        {/* 订单操作 */}
        <div className="bg-card border border-border rounded-lg p-4">
          <OrderActions orderId={order.id} currentStatus={order.status} />
        </div>

        {/* 商品明细 */}
        <div className="bg-card border border-border rounded-lg">
          <div className="p-4 border-b border-border">
            <h2 className="font-medium">商品明细</h2>
          </div>
          <div className="p-4 divide-y divide-border">
            {order.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-4 py-3 first:pt-0 last:pb-0"
              >
                {/* 图片 */}
                <Link
                  href={`/products/${item.product.slug}`}
                  className="shrink-0"
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
        </div>

        {/* 金额明细 */}
        <div className="bg-card border border-border rounded-lg">
          <div className="p-4 border-b border-border">
            <h2 className="font-medium">金额明细</h2>
          </div>
          <div className="p-4 space-y-2 text-sm">
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
        </div>

        {/* 时间信息 */}
        <div className="bg-card border border-border rounded-lg p-4 text-sm text-muted space-y-1">
          <p>下单时间：{formatDate(order.createdAt)}</p>
          <p>最近更新：{formatDate(order.updatedAt)}</p>
        </div>
      </div>
    </div>
  );
}
