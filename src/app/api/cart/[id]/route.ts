// PUT    /api/cart/[id] — 修改购物车项数量
// DELETE /api/cart/[id] — 删除购物车项

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";
import { updateCartItemSchema } from "@/lib/validations";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// ─── PUT 修改数量 ───
export async function PUT(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const userId = Number(auth.sub);
  const { id: idStr } = await params;
  const id = Number(idStr);

  if (isNaN(id)) {
    return NextResponse.json({ error: "无效的购物车项 ID" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const parsed = updateCartItemSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "请检查输入", fieldErrors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { quantity } = parsed.data;

    // 验证该购物车项属于当前用户
    const cartItem = await prisma.cartItem.findUnique({
      where: { id },
      select: { userId: true, productId: true, product: { select: { stock: true, name: true } } },
    });

    if (!cartItem) {
      return NextResponse.json({ error: "购物车项不存在" }, { status: 404 });
    }
    if (cartItem.userId !== userId) {
      return NextResponse.json({ error: "无权操作" }, { status: 403 });
    }

    // 检查库存
    if (quantity > cartItem.product.stock) {
      return NextResponse.json(
        { error: `「${cartItem.product.name}」库存不足，当前库存 ${cartItem.product.stock}` },
        { status: 400 }
      );
    }

    const updated = await prisma.cartItem.update({
      where: { id },
      data: { quantity },
      select: {
        id: true,
        quantity: true,
        product: {
          select: { id: true, name: true, slug: true, price: true, imageUrl: true, stock: true },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("更新购物车失败:", error);
    return NextResponse.json({ error: "更新购物车失败" }, { status: 500 });
  }
}

// ─── DELETE 删除 ───
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const userId = Number(auth.sub);
  const { id: idStr } = await params;
  const id = Number(idStr);

  if (isNaN(id)) {
    return NextResponse.json({ error: "无效的购物车项 ID" }, { status: 400 });
  }

  try {
    const cartItem = await prisma.cartItem.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!cartItem) {
      return NextResponse.json({ error: "购物车项不存在" }, { status: 404 });
    }
    if (cartItem.userId !== userId) {
      return NextResponse.json({ error: "无权操作" }, { status: 403 });
    }

    await prisma.cartItem.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("删除购物车项失败:", error);
    return NextResponse.json({ error: "删除购物车项失败" }, { status: 500 });
  }
}
