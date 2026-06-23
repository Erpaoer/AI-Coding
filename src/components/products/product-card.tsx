// 商品卡片 —— 展示缩略图、名称、价格、分类标签
// Server Component

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

interface ProductCardProps {
  product: {
    id: number;
    name: string;
    slug: string;
    price: number;
    imageUrl: string | null;
    stock: number;
    category: {
      id: number;
      name: string;
      slug: string;
    };
  };
}

export function ProductCard({ product }: ProductCardProps) {
  const isOutOfStock = product.stock <= 0;

  return (
    <Link href={`/products/${product.slug}`}>
      <Card hover className="h-full flex flex-col">
        {/* 商品图片 */}
        <div className="aspect-square bg-muted-background flex items-center justify-center overflow-hidden">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-4xl text-muted">📦</span>
          )}
        </div>

        <CardContent className="flex-1 flex flex-col gap-2">
          {/* 分类标签 */}
          <Badge variant="info">{product.category.name}</Badge>

          {/* 商品名称 */}
          <h3 className="font-medium text-sm line-clamp-2 leading-snug">
            {product.name}
          </h3>

          {/* 价格与库存 */}
          <div className="mt-auto flex items-center justify-between">
            <span className="text-lg font-bold text-primary">
              {formatCurrency(product.price)}
            </span>
            {isOutOfStock ? (
              <span className="text-xs text-danger">缺货</span>
            ) : product.stock < 10 ? (
              <span className="text-xs text-warning">
                仅剩 {product.stock} 件
              </span>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
