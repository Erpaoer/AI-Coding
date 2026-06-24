// GET    /api/admin/products/[id] — 商品详情
// PUT    /api/admin/products/[id] — 更新商品
// DELETE /api/admin/products/[id] — 删除商品
//
// proxy.ts 守卫 /api/admin（需 ADMIN），此处再做内联防御

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/api-auth";
import { productSchema } from "@/lib/validations";
import { slugify } from "@/lib/utils";
import { saveProductImage, deleteProductImage } from "@/lib/upload";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// ─── GET 商品详情 ───
export async function GET(
  req: NextRequest,
  { params }: RouteParams
) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const { id: idStr } = await params;
  const id = Number(idStr);

  if (isNaN(id)) {
    return NextResponse.json({ error: "无效的商品 ID" }, { status: 400 });
  }

  try {
    const product = await prisma.product.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
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
    });

    if (!product) {
      return NextResponse.json({ error: "商品不存在" }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("获取商品详情失败:", error);
    return NextResponse.json({ error: "获取商品详情失败" }, { status: 500 });
  }
}

// ─── PUT 更新商品 ───
export async function PUT(
  req: NextRequest,
  { params }: RouteParams
) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const { id: idStr } = await params;
  const id = Number(idStr);

  if (isNaN(id)) {
    return NextResponse.json({ error: "无效的商品 ID" }, { status: 400 });
  }

  try {
    // 先查是否存在
    const existing = await prisma.product.findUnique({
      where: { id },
      select: { id: true, imageUrl: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "商品不存在" }, { status: 404 });
    }

    // 接收 FormData（支持可选图片更新）
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

    // 检查 slug 是否被其他商品占用
    const slugConflict = await prisma.product.findUnique({ where: { slug } });
    if (slugConflict && slugConflict.id !== id) {
      return NextResponse.json(
        { error: `商品 URL 标识「${slug}」已被占用，请修改名称` },
        { status: 409 }
      );
    }

    // 处理图片：有新图则替换旧图
    let imageUrl = existing.imageUrl;
    if (image && image.size > 0) {
      try {
        const newUrl = await saveProductImage(image);
        // 删除旧图
        if (existing.imageUrl) {
          await deleteProductImage(existing.imageUrl);
        }
        imageUrl = newUrl;
      } catch (imgError) {
        return NextResponse.json(
          { error: imgError instanceof Error ? imgError.message : "图片上传失败" },
          { status: 400 }
        );
      }
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        name: data.name,
        slug,
        description: data.description,
        price: data.price,
        stock: data.stock,
        categoryId: data.categoryId,
        isActive: isActive !== "false",
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
        updatedAt: true,
        category: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error("更新商品失败:", error);
    return NextResponse.json({ error: "更新商品失败" }, { status: 500 });
  }
}

// ─── DELETE 删除商品 ───
export async function DELETE(
  req: NextRequest,
  { params }: RouteParams
) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const { id: idStr } = await params;
  const id = Number(idStr);

  if (isNaN(id)) {
    return NextResponse.json({ error: "无效的商品 ID" }, { status: 400 });
  }

  try {
    const existing = await prisma.product.findUnique({
      where: { id },
      select: { id: true, name: true, imageUrl: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "商品不存在" }, { status: 404 });
    }

    // 删除图片文件
    if (existing.imageUrl) {
      await deleteProductImage(existing.imageUrl);
    }

    // 删除商品（CartItem 级联删除）
    await prisma.product.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("删除商品失败:", error);
    return NextResponse.json({ error: "删除商品失败" }, { status: 500 });
  }
}
