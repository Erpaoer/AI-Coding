// 商品管理列表页 —— 搜索 + 分类筛选 + 分页表格 + 新增/编辑/删除
// Server Component

import Link from "next/link";
import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PAGINATION_DEFAULTS } from "@/lib/constants";
import { ProductTableActions } from "./product-table-actions";
import { SearchFilterBar } from "./search-filter-bar";

interface AdminProductsPageProps {
  searchParams: Promise<{
    search?: string;
    category?: string;
    page?: string;
  }>;
}

export default async function AdminProductsPage({
  searchParams,
}: AdminProductsPageProps) {
  const params = await searchParams;
  const search = params.search?.substring(0, 100) || undefined;
  const category = params.category || undefined;
  const page = Math.max(1, Number(params.page) || 1);
  const limit = PAGINATION_DEFAULTS.ADMIN_PAGE_SIZE;

  // 构建查询条件
  const where: Record<string, unknown> = {};
  if (search) {
    where.name = { contains: search };
  }
  if (category) {
    where.category = { slug: category };
  }

  const [products, total, categories] = await Promise.all([
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
    prisma.category.findMany({
      select: { id: true, name: true, slug: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">📦 商品管理</h1>
        <Link href="/admin/products/new">
          <Button>+ 新增商品</Button>
        </Link>
      </div>

      {/* 搜索 + 分类筛选 */}
      <SearchFilterBar
        defaultSearch={search}
        defaultCategory={category}
        categories={categories}
      />

      {/* 商品表格 */}
      <Card>
        <CardContent className="p-0">
          {products.length === 0 ? (
            <div className="py-8">
              <EmptyState
                icon="📦"
                title={search || category ? "没有匹配的商品" : "暂无商品"}
                description={
                  search || category
                    ? "请尝试修改筛选条件"
                    : "点击右上角按钮新增第一个商品"
                }
              />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted-background/50">
                      <th className="text-left py-3 px-4 font-medium text-muted w-12">#</th>
                      <th className="text-left py-3 px-4 font-medium text-muted">商品</th>
                      <th className="text-right py-3 px-4 font-medium text-muted">价格</th>
                      <th className="text-right py-3 px-4 font-medium text-muted">库存</th>
                      <th className="text-center py-3 px-4 font-medium text-muted">状态</th>
                      <th className="text-left py-3 px-4 font-medium text-muted hidden md:table-cell">分类</th>
                      <th className="text-right py-3 px-4 font-medium text-muted hidden lg:table-cell">更新时间</th>
                      <th className="text-right py-3 px-4 font-medium text-muted">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product, idx) => (
                      <tr
                        key={product.id}
                        className="border-b border-border last:border-0 hover:bg-muted-background/30 transition-colors"
                      >
                        <td className="py-3 px-4 text-muted">
                          {(page - 1) * limit + idx + 1}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            {/* 缩略图 */}
                            <div className="w-10 h-10 bg-muted-background rounded border border-border flex items-center justify-center overflow-hidden shrink-0">
                              {product.imageUrl ? (
                                <img
                                  src={product.imageUrl}
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-sm">📦</span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <Link
                                href={`/products/${product.slug}`}
                                className="font-medium hover:text-primary transition-colors line-clamp-1"
                                target="_blank"
                              >
                                {product.name}
                              </Link>
                              <p className="text-xs text-muted line-clamp-1 hidden sm:block">
                                {product.slug}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right font-medium">
                          {formatCurrency(product.price)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span
                            className={
                              product.stock === 0
                                ? "text-danger"
                                : product.stock < 10
                                ? "text-warning"
                                : ""
                            }
                          >
                            {product.stock}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge variant={product.isActive ? "success" : "default"}>
                            {product.isActive ? "上架" : "下架"}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 hidden md:table-cell">
                          <Badge variant="info">{product.category.name}</Badge>
                        </td>
                        <td className="py-3 px-4 text-right text-muted hidden lg:table-cell text-xs">
                          {formatDate(product.updatedAt)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <ProductTableActions
                            productId={product.id}
                            productName={product.name}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 统计信息 */}
              <div className="px-4 py-3 border-t border-border text-sm text-muted">
                共 {total} 件商品
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="mt-4 flex justify-center">
          <Pagination page={page} totalPages={totalPages} />
        </div>
      )}
    </div>
  );
}
