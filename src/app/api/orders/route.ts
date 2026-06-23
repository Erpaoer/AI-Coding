// GET  /api/orders — 我的订单列表（分页）
// POST /api/orders — 从购物车创建订单（事务：创建订单 → 扣库存 → 清购物车 → 更新会员等级）
//
// proxy.ts 守卫 /api/orders（需登录），此处再做内联防御

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";
import { getMembershipLevel, getDiscountByLevel } from "@/lib/constants";

// ─── GET 订单列表 ───
export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const userId = Number(auth.sub);

  const { searchParams } = req.nextUrl;
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit")) || 10));

  try {
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

    return NextResponse.json({ orders, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("获取订单列表失败:", error);
    return NextResponse.json({ error: "获取订单列表失败" }, { status: 500 });
  }
}

// ─── POST 从购物车创建订单 ───
export async function POST() {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const userId = Number(auth.sub);

  try {
    // 1. 获取购物车（含商品信息）
    const cartItems = await prisma.cartItem.findMany({
      where: { userId },
      select: {
        id: true,
        quantity: true,
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            stock: true,
            isActive: true,
          },
        },
      },
    });

    if (cartItems.length === 0) {
      return NextResponse.json({ error: "购物车为空" }, { status: 400 });
    }

    // 2. 过滤已下架商品
    const activeItems = cartItems.filter((item) => item.product.isActive);
    if (activeItems.length === 0) {
      return NextResponse.json({ error: "购物车中没有可购买的商品" }, { status: 400 });
    }

    // 3. 逐项检查库存（给出具体缺货商品）
    const outOfStock: string[] = [];
    for (const item of activeItems) {
      if (item.quantity > item.product.stock) {
        outOfStock.push(
          `「${item.product.name}」库存不足（需要 ${item.quantity} 件，当前库存 ${item.product.stock} 件）`
        );
      }
    }
    if (outOfStock.length > 0) {
      return NextResponse.json({ error: outOfStock.join("；") }, { status: 400 });
    }

    // 4. 计算金额
    const originalTotal = activeItems.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );

    // 5. 获取用户当前会员等级 → 折扣
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { totalSpent: true, membershipLevel: true },
    });

    // 防御：认证用户理论上一定存在，但极端情况下可能被删除
    if (!user) {
      return NextResponse.json({ error: "用户不存在" }, { status: 500 });
    }

    const currentTotalSpent = user.totalSpent;
    const level = getMembershipLevel(currentTotalSpent);
    const discount = getDiscountByLevel(level);

    // 折后金额（保留 2 位小数）
    const total = Math.round(originalTotal * discount * 100) / 100;

    // 6. 事务：创建订单 + 扣库存(含验证) + 清购物车 + 更新用户消费
    const order = await prisma.$transaction(async (tx) => {
      // 创建订单 + 订单明细（价格快照）
      const order = await tx.order.create({
        data: {
          userId,
          status: "PENDING",
          originalTotal,
          discount,
          total,
          items: {
            create: activeItems.map((item) => ({
              productId: item.product.id,
              quantity: item.quantity,
              price: item.product.price, // 快照，后续调价不影响历史
            })),
          },
        },
        select: {
          id: true,
          status: true,
          originalTotal: true,
          discount: true,
          total: true,
          createdAt: true,
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

      // 扣减库存，并验证事务内库存 ≥ 0（防御并发超卖）
      for (const item of activeItems) {
        const updated = await tx.product.update({
          where: { id: item.product.id },
          data: { stock: { decrement: item.quantity } },
          select: { stock: true, name: true },
        });
        if (updated.stock < 0) {
          throw new Error(`「${updated.name}」库存已被抢光，请重新下单`);
        }
      }

      // 清空购物车
      await tx.cartItem.deleteMany({ where: { userId } });

      // 更新用户累计消费 + 会员等级
      const newTotalSpent = currentTotalSpent + total;
      const newLevel = getMembershipLevel(newTotalSpent);
      await tx.user.update({
        where: { id: userId },
        data: { totalSpent: newTotalSpent, membershipLevel: newLevel },
      });

      return order;
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error("创建订单失败:", error);
    return NextResponse.json({ error: "创建订单失败" }, { status: 500 });
  }
}
