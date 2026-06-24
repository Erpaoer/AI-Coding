// GET /api/admin/orders/[id] — 订单详情（含用户信息 + 明细）
// PUT /api/admin/orders/[id] — 更新订单状态（管理员可执行所有流转）
//
// 管理员状态操作：
//   PENDING → PAID（手动标记支付）
//   PAID → SHIPPED（发货）
//   SHIPPED → COMPLETED（完成）
//   任意状态 → CANCELLED（取消，恢复库存 + 退款累计消费）
//
// proxy.ts 守卫 /api/admin（需 ADMIN），此处再做内联防御

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/api-auth";
import { orderStatusSchema } from "@/lib/validations";
import {
  ORDER_TRANSITIONS,
  ORDER_STATUS_LABELS,
  getMembershipLevel,
} from "@/lib/constants";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// ─── GET 订单详情 ───
export async function GET(
  req: NextRequest,
  { params }: RouteParams
) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

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

    if (!order) {
      return NextResponse.json({ error: "订单不存在" }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("获取订单详情失败:", error instanceof Error ? error.message : String(error));
    return NextResponse.json({ error: "获取订单详情失败" }, { status: 500 });
  }
}

// ─── PUT 更新订单状态 ───
export async function PUT(
  req: NextRequest,
  { params }: RouteParams
) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const { id: idStr } = await params;
  const id = Number(idStr);

  if (isNaN(id)) {
    return NextResponse.json({ error: "无效的订单 ID" }, { status: 400 });
  }

  // 尽早解析 JSON body，避免 500 误报
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "请求体必须为有效的 JSON" }, { status: 400 });
  }

  try {
    const parsed = orderStatusSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "无效的订单状态" },
        { status: 400 }
      );
    }

    const { status: newStatus } = parsed.data;

    // 查当前订单（含 userId 用于取消时退款）
    const order = await prisma.order.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        status: true,
        total: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "订单不存在" }, { status: 404 });
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

    // 取消订单 → 事务：条件更新防 TOCTOU + 恢复库存 + 退款累计消费
    if (newStatus === "CANCELLED") {
      await prisma.$transaction(async (tx) => {
        // 条件更新：仅在非 CANCELLED 时执行，第二并发请求 count=0 直接跳过
        const updateResult = await tx.order.updateMany({
          where: { id, status: { not: "CANCELLED" } },
          data: { status: "CANCELLED" },
        });

        if (updateResult.count === 0) {
          throw new Error("ORDER_ALREADY_CANCELLED");
        }

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

        // 2. 事务内重新读取订单金额（避免使用事务外的过期值）
        const cancelledOrder = await tx.order.findUnique({
          where: { id },
          select: { total: true },
        });

        // 3. 原子递减累计消费 + 重算会员等级
        if (cancelledOrder) {
          const updatedUser = await tx.user.update({
            where: { id: order.userId },
            data: { totalSpent: { decrement: cancelledOrder.total } },
            select: { totalSpent: true },
          });
          const safeTotal = Math.max(0, updatedUser.totalSpent);
          const newLevel = getMembershipLevel(safeTotal);
          await tx.user.update({
            where: { id: order.userId },
            data: { membershipLevel: newLevel },
          });
        }
      });
    } else {
      // 非取消操作：直接更新状态
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
        user: {
          select: { id: true, email: true, name: true },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg === "ORDER_ALREADY_CANCELLED") {
      return NextResponse.json({ error: "订单已被取消，无法重复操作" }, { status: 409 });
    }
    console.error("更新订单状态失败:", error instanceof Error ? error.message : String(error));
    return NextResponse.json({ error: "更新订单状态失败" }, { status: 500 });
  }
}
