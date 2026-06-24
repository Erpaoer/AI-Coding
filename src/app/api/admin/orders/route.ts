// GET /api/admin/orders — 全部订单列表（含用户信息 + 状态筛选 + 分页）
//
// proxy.ts 守卫 /api/admin（需 ADMIN），此处再做内联防御

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/api-auth";
import { ORDER_STATUSES, PAGINATION_DEFAULTS } from "@/lib/constants";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = req.nextUrl;
  const status = searchParams.get("status") || undefined;
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit")) || PAGINATION_DEFAULTS.ADMIN_PAGE_SIZE));

  // 构建查询条件
  const where: Record<string, unknown> = {};

  // 状态筛选（校验是否为有效状态）
  if (status && (ORDER_STATUSES as readonly string[]).includes(status)) {
    where.status = status;
  }

  try {
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
          updatedAt: true,
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

    return NextResponse.json({
      orders,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("获取订单列表失败:", error);
    return NextResponse.json({ error: "获取订单列表失败" }, { status: 500 });
  }
}
