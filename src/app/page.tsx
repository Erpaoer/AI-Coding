// 首页 —— 商品网格展示 + 搜索框 + 分类标签切换 + 分页
// Server Component，直接查询数据库

import { prisma } from "@/lib/db";
import { ProductCard } from "@/components/products/product-card";
import { ProductGrid } from "@/components/products/product-grid";
import { SearchBar } from "@/components/products/search-bar";
import { CategoryFilter } from "@/components/products/category-filter";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import Link from "next/link";

const PAGE_SIZE = 9;

interface HomePageProps {
  searchParams: Promise<{
    search?: string;
    category?: string;
    page?: string;
  }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  // 截断搜索关键词，防止超长字符串攻击
  const search = params.search?.substring(0, 100) || undefined;
  const categorySlug = params.category || undefined;
  const page = Math.max(1, Number(params.page) || 1);

  // ─── 并行获取分类列表和商品数据 ───
  const [categories, { products, total, totalPages }] = await Promise.all([
    // 分类列表（含商品计数）
    prisma.category.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        _count: {
          select: {
            products: { where: { isActive: true } },
          },
        },
      },
      orderBy: { name: "asc" },
    }),

    // 商品分页查询
    (async () => {
      const where: Record<string, unknown> = {
        isActive: true,
      };

      if (search) {
        where.name = { contains: search };
      }

      if (categorySlug) {
        where.category = { slug: categorySlug };
      }

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
          skip: (page - 1) * PAGE_SIZE,
          take: PAGE_SIZE,
        }),
        prisma.product.count({ where }),
      ]);

      return {
        products,
        total,
        totalPages: Math.ceil(total / PAGE_SIZE),
      };
    })(),
  ]);

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold">🛍️ 商品浏览</h1>
        <p className="text-sm text-muted mt-1">
          发现您喜欢的商品，共 {total} 件
        </p>
      </div>

      {/* 搜索框 */}
      <SearchBar />

      {/* 分类标签 */}
      {categories.length > 0 && (
        <CategoryFilter categories={categories} />
      )}

      {/* 商品网格或空状态 */}
      {products.length > 0 ? (
        <>
          <ProductGrid>
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </ProductGrid>

          {/* 分页导航 */}
          <div className="mt-8">
            <Pagination page={page} totalPages={totalPages} />
          </div>
        </>
      ) : (
        <EmptyState
          icon="🔍"
          title="没有找到商品"
          description={
            search || categorySlug
              ? "试试更换搜索关键词或清除筛选条件"
              : "商品正在上架中，请稍后再来"
          }
          action={
            (search || categorySlug) ? (
              <Link
                href="/"
                className="text-sm text-primary hover:underline"
              >
                清除所有筛选
              </Link>
            ) : undefined
          }
        />
      )}
    </div>
  );
}
