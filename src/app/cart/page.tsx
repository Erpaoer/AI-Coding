// 购物车页面 —— 需登录访问
// proxy.ts 守卫 /cart（未登录 → 302 /login），此处也有内联保护
//
// 服务端获取购物车数据，客户端组件处理交互

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { CartItemRow } from "@/components/cart/cart-item-row";
import { CartSummary } from "@/components/cart/cart-summary";
import { EmptyState } from "@/components/ui/empty-state";
import Link from "next/link";

export default async function CartPage() {
  // 服务端认证保护（防御性，proxy.ts 已经守卫了）
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const userId = Number(user.sub);

  const items = await prisma.cartItem.findMany({
    where: { userId },
    select: {
      id: true,
      quantity: true,
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          imageUrl: true,
          stock: true,
          isActive: true,
        },
      },
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  // 计算总金额（只算上架商品）
  const activeItems = items.filter((item) => item.product.isActive);
  const totalAmount = activeItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  const itemCount = activeItems.reduce((sum, item) => sum + item.quantity, 0);

  const hasOfflineItems = items.some((item) => !item.product.isActive);

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">🛒 我的购物车</h1>

      {items.length === 0 ? (
        <EmptyState
          icon="🛒"
          title="购物车是空的"
          description="快去挑选喜欢的商品吧"
          action={<Link href="/" className="text-primary hover:underline text-sm">去逛逛</Link>}
        />
      ) : (
        <div className="space-y-4">
          {/* 商品列表 */}
          <div className="bg-card border border-border rounded-lg px-4">
            {items.map((item) => (
              <CartItemRow
                key={item.id}
                item={item}
              />
            ))}
          </div>

          {/* 已下架提醒 */}
          {hasOfflineItems && (
            <p className="text-sm text-muted">
              ⚠️ 部分商品已下架，不会计入总价，请及时清理
            </p>
          )}

          {/* 汇总 + 提交订单 */}
          <CartSummary totalAmount={totalAmount} itemCount={itemCount} />
        </div>
      )}
    </div>
  );
}
