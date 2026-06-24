// GET /api/products/[id] — 商品详情（含关联分类信息）
// 公开访问，仅返回活跃商品

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const idSchema = z.coerce.number().int().positive("商品 ID 必须为正整数");

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const parsed = idSchema.safeParse(id);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "商品 ID 格式不正确" },
      { status: 400 }
    );
  }

  try {
    const product = await prisma.product.findUnique({
      where: { id: parsed.data, isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        price: true,
        imageUrl: true,
        stock: true,
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

    // 脱敏：仅返回是否有库存，不暴露精确库存量
    const { stock, ...rest } = product;
    return NextResponse.json({ ...rest, inStock: stock > 0 });
  } catch (error) {
    console.error("获取商品详情失败:", error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { error: "获取商品详情失败，请稍后重试" },
      { status: 500 }
    );
  }
}
