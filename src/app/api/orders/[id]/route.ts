// GET /api/orders/[id] — 订单详情（仅限自己的订单）
// PUT /api/orders/[id] — 更新订单状态（状态机校验）
//
// 状态流转：PENDING → PAID → SHIPPED → COMPLETED（任意 → CANCELLED）
// 用户可操作：PENDING → PAID（模拟支付）、任意 → CANCELLED（取消）
// 管理员操作：PAID → SHIPPED、SHIPPED → COMPLETED（Phase 7 实现）

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";
import { orderStatusSchema } from "@/lib/validations";
import { ORDER_TRANSITIONS, ORDER_STATUS_LABELS, getMembershipLevel } from "@/lib/constants";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// ─── GET 订单详情 ───
export async function GET(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const userId = Number(auth.sub);
  const { id: idStr } = await params;
  const id = Number(idStr);

  if (isNaN(id)) {
    return NextResponse.json({ error: "无效的订单 ID" }, { status: 400 });
  }

  try {
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

    if (!order) {
      return NextResponse.json({ error: "订单不存在" }, { status: 404 });
    }
    if (order.userId !== userId) {
      return NextResponse.json({ error: "无权访问此订单" }, { status: 403 });
    }

    // 不返回 userId 给前端
    const { userId: _, ...rest } = order;
    return NextResponse.json(rest);
  } catch (error) {
    console.error("获取订单详情失败:", error);
    return NextResponse.json({ error: "获取订单详情失败" }, { status: 500 });
  }
}

// ─── PUT 更新订单状态 ───
export async function PUT(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const userId = Number(auth.sub);
  const { id: idStr } = await params;
  const id = Number(idStr);

  if (isNaN(id)) {
    return NextResponse.json({ error: "无效的订单 ID" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const parsed = orderStatusSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "无效的订单状态", fieldErrors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { status: newStatus } = parsed.data;

    // 查当前订单
    const order = await prisma.order.findUnique({
      where: { id },
      select: { id: true, userId: true, status: true },
    });

    if (!order) {
      return NextResponse.json({ error: "订单不存在" }, { status: 404 });
    }
    if (order.userId !== userId) {
      return NextResponse.json({ error: "无权操作此订单" }, { status: 403 });
    }

    // 状态机校验
    const allowed = ORDER_TRANSITIONS[order.status];
    if (!allowed || !allowed.includes(newStatus)) {
      const fromLabel = ORDER_STATUS_LABELS[order.status] || order.status;
      const toLabel = ORDER_STATUS_LABELS[newStatus] || newStatus;
      return NextResponse.json(
        { error: `不能将订单从「${fromLabel}」变更为「${toLabel}」` },
        { status: 400 }
      );
    }

    // 取消订单 → 事务：恢复库存 + 退款累计消费 + 更新会员等级
    if (newStatus === "CANCELLED") {
      await prisma.$transaction(async (tx) => {
        // 1. 恢复库存
        const items = await tx.orderItem.findMany({
          where: { orderId: id },
          select: { productId: true, quantity: true },
        });

        for (const item of items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }

        // 2. 获取订单金额用于退款
        const cancelledOrder = await tx.order.findUnique({
          where: { id },
          select: { total: true },
        });

        // 3. 退还用户累计消费 + 重算会员等级
        const currentUser = await tx.user.findUnique({
          where: { id: userId },
          select: { totalSpent: true },
        });

        if (currentUser && cancelledOrder) {
          const newTotalSpent = Math.max(0, currentUser.totalSpent - cancelledOrder.total);
          const newLevel = getMembershipLevel(newTotalSpent);
          await tx.user.update({
            where: { id: userId },
            data: { totalSpent: newTotalSpent, membershipLevel: newLevel },
          });
        }

        // 4. 更新订单状态
        await tx.order.update({
          where: { id },
          data: { status: newStatus },
        });
      });
    } else {
      await prisma.order.update({
        where: { id },
        data: { status: newStatus },
      });
    }

    // 返回更新后的订单摘要
    const updated = await prisma.order.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        total: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("更新订单状态失败:", error);
    return NextResponse.json({ error: "更新订单状态失败" }, { status: 500 });
  }
}
