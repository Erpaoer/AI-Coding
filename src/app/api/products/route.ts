// GET /api/products — 商品列表（搜索 + 分类筛选 + 分页）
// 每页默认 9 条，公开访问

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  // 截断搜索关键词，防止超长字符串攻击
  const rawSearch = searchParams.get("search") || "";
  const search = rawSearch.substring(0, 100) || undefined;
  const category = searchParams.get("category") || undefined;
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit")) || 9));

  // 构建查询条件
  const where: Record<string, unknown> = {
    isActive: true, // 只返回上架商品
  };

  // 按名称模糊搜索
  if (search) {
    where.name = { contains: search };
  }

  // 按分类 slug 筛选
  if (category) {
    where.category = { slug: category };
  }

  try {
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          imageUrl: true,
          stock: true,
          category: {
            select: { id: true, name: true, slug: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({
      products,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("获取商品列表失败:", error);
    return NextResponse.json(
      { error: "获取商品列表失败，请稍后重试" },
      { status: 500 }
    );
  }
}
