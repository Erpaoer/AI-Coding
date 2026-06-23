// GET  /api/cart — 获取当前用户购物车
// POST /api/cart — 加入购物车
//
// proxy.ts 守卫 /api/cart（需登录），这里再做内联认证防御

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";
import { cartItemSchema } from "@/lib/validations";

// ─── GET 获取购物车 ───
export async function GET() {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const userId = Number(auth.sub);

  try {
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

    // 过滤已下架商品（客户端标记但不主动删除购物车项）
    const totalAmount = items.reduce((sum, item) => {
      if (!item.product.isActive) return sum;
      return sum + item.product.price * item.quantity;
    }, 0);

    return NextResponse.json({ items, totalAmount });
  } catch (error) {
    console.error("获取购物车失败:", error);
    return NextResponse.json({ error: "获取购物车失败" }, { status: 500 });
  }
}

// ─── POST 加入购物车 ───
export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const userId = Number(auth.sub);

  try {
    const body = await req.json();
    const parsed = cartItemSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "请检查输入", fieldErrors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { productId, quantity } = parsed.data;

    // 检查商品是否存在且上架
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, stock: true, isActive: true, name: true },
    });

    if (!product) {
      return NextResponse.json({ error: "商品不存在" }, { status: 404 });
    }
    if (!product.isActive) {
      return NextResponse.json({ error: "商品已下架" }, { status: 400 });
    }

    // 检查库存：已有数量 + 新增数量 ≤ 库存
    const existing = await prisma.cartItem.findUnique({
      where: { userId_productId: { userId, productId } },
      select: { id: true, quantity: true },
    });

    const newQuantity = (existing?.quantity ?? 0) + quantity;
    if (newQuantity > product.stock) {
      return NextResponse.json(
        {
          error: `「${product.name}」库存不足，当前库存 ${product.stock}，购物车已有 ${existing?.quantity ?? 0} 件`,
        },
        { status: 400 }
      );
    }

    // upsert：已存在 → 累加数量，不存在 → 创建
    const cartItem = await prisma.cartItem.upsert({
      where: { userId_productId: { userId, productId } },
      create: { userId, productId, quantity },
      update: { quantity: { increment: quantity } },
      select: {
        id: true,
        quantity: true,
        product: {
          select: { id: true, name: true, slug: true, price: true, imageUrl: true, stock: true },
        },
      },
    });

    return NextResponse.json(cartItem, { status: 201 });
  } catch (error) {
    console.error("加入购物车失败:", error);
    return NextResponse.json({ error: "加入购物车失败" }, { status: 500 });
  }
}
