// 商品详情页 —— 大图 + 名称/价格/描述/库存/分类 + 加入购物车按钮
// Server Component，通过 slug 查询商品

import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AddToCartButton } from "@/components/products/add-to-cart-button";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";

interface ProductDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProductDetailPage({
  params,
}: ProductDetailPageProps) {
  const { slug } = await params;

  const product = await prisma.product.findUnique({
    where: { slug },
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

  // 商品不存在或已下架 → 404
  if (!product || !product.isActive) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 面包屑导航 */}
      <nav className="flex items-center gap-2 text-sm text-muted">
        <Link href="/" className="hover:text-primary transition-colors">
          首页
        </Link>
        <span>/</span>
        <Link
          href={`/?category=${product.category.slug}`}
          className="hover:text-primary transition-colors"
        >
          {product.category.name}
        </Link>
        <span>/</span>
        <span className="text-foreground">{product.name}</span>
      </nav>

      {/* 商品主体：左图右信息 */}
      <Card>
        <CardContent className="p-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
            {/* 左侧：商品图片 */}
            <div className="aspect-square bg-muted-background flex items-center justify-center overflow-hidden rounded-l-lg">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-8xl text-muted">📦</span>
              )}
            </div>

            {/* 右侧：商品信息 */}
            <div className="p-6 md:p-8 flex flex-col gap-5">
              {/* 分类标签 */}
              <div>
                <Link href={`/?category=${product.category.slug}`}>
                  <Badge variant="info">{product.category.name}</Badge>
                </Link>
              </div>

              {/* 商品名称 */}
              <h1 className="text-2xl font-bold leading-tight">
                {product.name}
              </h1>

              {/* 价格 */}
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-primary">
                  {formatCurrency(product.price)}
                </span>
              </div>

              {/* 库存状态 */}
              <div className="flex items-center gap-2">
                {product.stock > 0 ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-success inline-block" />
                    <span className="text-sm text-success font-medium">
                      有货
                    </span>
                    {product.stock <= 10 && (
                      <span className="text-xs text-warning">
                        （仅剩 {product.stock} 件）
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-danger inline-block" />
                    <span className="text-sm text-danger font-medium">
                      暂时缺货
                    </span>
                  </>
                )}
              </div>

              {/* 加入购物车按钮 */}
              <div className="mt-2">
                <AddToCartButton
                  productId={product.id}
                  productName={product.name}
                  stock={product.stock}
                />
              </div>

              {/* 商品描述 */}
              <div className="border-t border-border pt-5 mt-2">
                <h2 className="text-sm font-semibold mb-2">商品描述</h2>
                <p className="text-sm text-muted leading-relaxed whitespace-pre-line">
                  {product.description}
                </p>
              </div>

              {/* 附加信息 */}
              <div className="border-t border-border pt-4 text-xs text-muted space-y-1">
                <p>
                  上架时间：{formatDate(product.createdAt)}
                </p>
                <p>
                  最近更新：{formatDate(product.updatedAt)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 返回链接 */}
      <div className="text-center">
        <Link
          href="/"
          className="text-sm text-primary hover:underline"
        >
          ← 继续浏览其他商品
        </Link>
      </div>
    </div>
  );
}
