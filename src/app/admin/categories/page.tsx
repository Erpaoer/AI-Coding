// 分类管理页 —— 列表 + 行内新增
// Server Component：获取分类数据，渲染客户端交互组件

import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CategoryManager } from "./category-manager";

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      createdAt: true,
      _count: { select: { products: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">📂 分类管理</h1>

      <Card>
        <CardHeader>
          <p className="text-sm text-muted">
            管理商品分类，新增或删除分类。删除前请确保分类下无商品。
          </p>
        </CardHeader>
        <CardContent>
          <CategoryManager categories={categories} />
        </CardContent>
      </Card>
    </div>
  );
}
