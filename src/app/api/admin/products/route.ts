// GET  /api/admin/products — 商品列表（搜索 + 分类筛选 + 分页，含下架商品）
// POST /api/admin/products — 新增商品（支持图片上传）
//
// proxy.ts 守卫 /api/admin（需 ADMIN），此处再做内联防御

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/api-auth";
import { productSchema } from "@/lib/validations";
import { slugify } from "@/lib/utils";
import { saveProductImage } from "@/lib/upload";
import { PAGINATION_DEFAULTS } from "@/lib/constants";

// ─── GET 商品列表 ───
export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = req.nextUrl;
  const rawSearch = searchParams.get("search") || "";
  const search = rawSearch.substring(0, 100) || undefined;
  const category = searchParams.get("category") || undefined;
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit")) || PAGINATION_DEFAULTS.ADMIN_PAGE_SIZE));

  // 构建查询条件（管理员可见所有状态）
  const where: Record<string, unknown> = {};

  if (search) {
    where.name = { contains: search };
  }

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
          stock: true,
          isActive: true,
          imageUrl: true,
          createdAt: true,
          updatedAt: true,
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
    return NextResponse.json({ error: "获取商品列表失败" }, { status: 500 });
  }
}

// ─── POST 新增商品 ───
export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    // 接收 FormData（支持图片上传）
    const formData = await req.formData();

    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const price = formData.get("price") as string;
    const stock = formData.get("stock") as string;
    const categoryId = formData.get("categoryId") as string;
    const isActive = formData.get("isActive") as string | null;
    const image = formData.get("image") as File | null;

    // Zod 校验
    const parsed = productSchema.safeParse({
      name,
      description,
      price,
      stock,
      categoryId,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "请检查输入", fieldErrors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const slug = slugify(data.name);

    if (!slug) {
      return NextResponse.json(
        { error: "商品名称无效，无法生成 URL 标识" },
        { status: 400 }
      );
    }

    // 检查 slug 重复
    const existing = await prisma.product.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json(
        { error: `商品「${data.name}」的 URL 标识与已有商品冲突，请修改名称` },
        { status: 409 }
      );
    }

    // 处理图片上传
    let imageUrl: string | null = null;
    if (image && image.size > 0) {
      try {
        imageUrl = await saveProductImage(image);
      } catch (imgError) {
        return NextResponse.json(
          { error: imgError instanceof Error ? imgError.message : "图片上传失败" },
          { status: 400 }
        );
      }
    }

    const product = await prisma.product.create({
      data: {
        name: data.name,
        slug,
        description: data.description,
        price: data.price,
        stock: data.stock,
        categoryId: data.categoryId,
        isActive: isActive !== "false", // 默认为 true
        imageUrl,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        stock: true,
        isActive: true,
        imageUrl: true,
        createdAt: true,
        category: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("创建商品失败:", error);
    return NextResponse.json({ error: "创建商品失败" }, { status: 500 });
  }
}
