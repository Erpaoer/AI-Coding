// 新增商品页面 —— Client Form
// Server Component 获取分类列表，传给 Client Form 组件

import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { ProductForm } from "@/components/admin/product-form";

export default async function NewProductPage() {
  const categories = await prisma.category.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">✨ 新增商品</h1>

      <Card>
        <CardContent className="p-6">
          <ProductForm categories={categories} mode="create" />
        </CardContent>
      </Card>
    </div>
  );
}
