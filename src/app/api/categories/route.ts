// GET /api/categories — 分类列表（含每个分类下的上架商品数量）
// 公开访问

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        _count: {
          select: {
            products: {
              where: { isActive: true },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error("获取分类列表失败:", error);
    return NextResponse.json(
      { error: "获取分类列表失败，请稍后重试" },
      { status: 500 }
    );
  }
}
