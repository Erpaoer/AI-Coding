// GET /api/products/[id] — 商品详情（含关联分类信息）
// 公开访问

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const productId = Number(id);

  if (isNaN(productId)) {
    return NextResponse.json(
      { error: "商品 ID 格式不正确" },
      { status: 400 }
    );
  }

  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        price: true,
        imageUrl: true,
        stock: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        category: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "商品不存在" },
        { status: 404 }
      );
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("获取商品详情失败:", error);
    return NextResponse.json(
      { error: "获取商品详情失败，请稍后重试" },
      { status: 500 }
    );
  }
}
