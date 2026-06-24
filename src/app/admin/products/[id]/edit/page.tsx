// 编辑商品页面 —— 服务端获取数据 + Client Form
// 预填已有字段

import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { ProductForm } from "@/components/admin/product-form";

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({
  params,
}: EditProductPageProps) {
  const { id: idStr } = await params;
  const id = Number(idStr);

  if (isNaN(id)) notFound();

  const [product, categories] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        stock: true,
        categoryId: true,
        isActive: true,
        imageUrl: true,
      },
    }),
    prisma.category.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!product) notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">✏️ 编辑商品：{product.name}</h1>

      <Card>
        <CardContent className="p-6">
          <ProductForm
            categories={categories}
            mode="edit"
            productId={product.id}
            defaultValues={{
              name: product.name,
              description: product.description,
              price: product.price,
              stock: product.stock,
              categoryId: product.categoryId,
              isActive: product.isActive,
              imageUrl: product.imageUrl,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
