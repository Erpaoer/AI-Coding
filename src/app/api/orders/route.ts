// GET  /api/orders — 我的订单列表（分页）
// POST /api/orders — 从购物车创建订单（事务：创建订单 → 扣库存 → 清购物车 → 更新会员等级）
//
// proxy.ts 守卫 /api/orders（需登录），此处再做内联防御

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";
import { getMembershipLevel, getDiscountByLevel } from "@/lib/constants";

/** 事务内库存不足异常 */
class StockExhaustedError extends Error {
  constructor(public readonly productName: string) {
    super(`库存已被抢光: ${productName}`);
  }
}

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

    // 3. 逐项检查库存
    const outOfStock: string[] = [];
    for (const item of activeItems) {
      if (item.quantity > item.product.stock) {
        outOfStock.push(item.product.name);
      }
    }
    if (outOfStock.length > 0) {
      console.warn("库存不足，商品:", outOfStock.join("、"));
      return NextResponse.json(
        { error: "部分商品库存不足，请调整数量后重试" },
        { status: 400 }
      );
    }

    // 4. 计算金额
    const originalTotal = activeItems.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );

    // 5. 事务：创建订单 + 扣库存(含验证) + 清购物车 + 更新用户消费
    //    totalSpent 在事务内原子读取 → 消除 lost-update 竞态条件
    const order = await prisma.$transaction(async (tx) => {
      // 在事务内读取用户当前 totalSpent（原子性读-改-写）
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { totalSpent: true, membershipLevel: true },
      });

      if (!user) {
        throw new Error("用户不存在");
      }

      const level = getMembershipLevel(user.totalSpent);
      const discount = getDiscountByLevel(level);

      // 折后金额（保留 2 位小数）
      const total = Math.round(originalTotal * discount * 100) / 100;

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
          throw new StockExhaustedError(updated.name);
        }
      }

      // 清空购物车
      await tx.cartItem.deleteMany({ where: { userId } });

      // 原子递增累计消费 + 更新会员等级
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { totalSpent: { increment: total } },
        select: { totalSpent: true },
      });
      const newLevel = getMembershipLevel(updatedUser.totalSpent);
      await tx.user.update({
        where: { id: userId },
        data: { membershipLevel: newLevel },
      });

      return order;
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    // 事务内库存被抢光 → 返回具体提示
    if (error instanceof StockExhaustedError) {
      return NextResponse.json(
        { error: `「${error.productName}」库存已被抢光，请重新下单` },
        { status: 400 }
      );
    }
    console.error("创建订单失败:", error instanceof Error ? error.message : String(error));
    return NextResponse.json({ error: "创建订单失败" }, { status: 500 });
  }
}
