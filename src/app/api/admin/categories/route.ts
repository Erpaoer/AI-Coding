// GET  /api/admin/categories — 全部分类列表（含商品计数）
// POST /api/admin/categories — 新增分类
//
// proxy.ts 守卫 /api/admin（需 ADMIN），此处再做内联防御

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/api-auth";
import { categorySchema } from "@/lib/validations";
import { slugify } from "@/lib/utils";

// ─── GET 分类列表 ───
export async function GET() {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        createdAt: true,
        _count: {
          select: { products: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error("获取分类列表失败:", error);
    return NextResponse.json({ error: "获取分类列表失败" }, { status: 500 });
  }
}

// ─── POST 新增分类 ───
export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const parsed = categorySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "请检查输入", fieldErrors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name } = parsed.data;
    const slug = slugify(name);

    if (!slug) {
      return NextResponse.json(
        { error: "分类名称无效，无法生成 URL 标识" },
        { status: 400 }
      );
    }

    // 检查名称或 slug 是否重复
    const existing = await prisma.category.findFirst({
      where: { OR: [{ name }, { slug }] },
    });
    if (existing) {
      return NextResponse.json(
        { error: `分类「${name}」已存在` },
        { status: 409 }
      );
    }

    const category = await prisma.category.create({
      data: { name, slug },
      select: {
        id: true,
        name: true,
        slug: true,
        createdAt: true,
        _count: { select: { products: true } },
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("创建分类失败:", error);
    return NextResponse.json({ error: "创建分类失败" }, { status: 500 });
  }
}
