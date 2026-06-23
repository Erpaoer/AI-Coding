"use client";

// 购物车单行：商品图片 + 名称 + 单价 + 数量 ± + 小计 + 删除
// 通过 fetch API 调用来修改数量/删除

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

export interface CartItemData {
  id: number;
  quantity: number;
  product: {
    id: number;
    name: string;
    slug: string;
    price: number;
    imageUrl: string | null;
    stock: number;
    isActive: boolean;
  };
}

interface CartItemRowProps {
  item: CartItemData;
}

export function CartItemRow({ item }: CartItemRowProps) {
  const router = useRouter();
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subtotal = item.product.price * item.quantity;

  const updateQuantity = async (newQty: number) => {
    if (newQty < 1) return;
    setError(null);
    setUpdating(true);
    try {
      const res = await fetch(`/api/cart/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: newQty }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "操作失败");
      } else {
        router.refresh();
      }
    } catch {
      setError("网络错误，请重试");
    } finally {
      setUpdating(false);
    }
  };

  const remove = async () => {
    if (!window.confirm(`确定要从购物车移除「${item.product.name}」吗？`)) return;
    setError(null);
    setUpdating(true);
    try {
      const res = await fetch(`/api/cart/${item.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "删除失败");
      } else {
        router.refresh();
      }
    } catch {
      setError("网络错误，请重试");
    } finally {
      setUpdating(false);
    }
  };

  const isMaxStock = item.quantity >= item.product.stock;

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 py-4 border-b border-border last:border-0">
      {/* 图片 */}
      <Link href={`/products/${item.product.slug}`} className="shrink-0">
        <div className="w-20 h-20 bg-muted-background rounded-md border border-border flex items-center justify-center overflow-hidden">
          {item.product.imageUrl ? (
            <img
              src={item.product.imageUrl}
              alt={item.product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-2xl">📦</span>
          )}
        </div>
      </Link>

      {/* 商品信息 */}
      <div className="flex-1 min-w-0">
        <Link
          href={`/products/${item.product.slug}`}
          className="font-medium text-foreground hover:text-primary transition-colors line-clamp-1"
        >
          {item.product.name}
        </Link>
        {!item.product.isActive && (
          <span className="text-xs text-danger">（已下架）</span>
        )}
        <p className="text-sm text-muted mt-0.5">{formatCurrency(item.product.price)}</p>
        {error && <p className="text-xs text-danger mt-1">{error}</p>}
      </div>

      {/* 数量控制 */}
      <div className="flex items-center gap-1 shrink-0">
        <Button
          variant="secondary"
          size="sm"
          disabled={updating || item.quantity <= 1}
          onClick={() => updateQuantity(item.quantity - 1)}
          className="w-8 h-8 p-0 text-sm"
        >
          −
        </Button>
        <span className="w-10 text-center text-sm tabular-nums">{item.quantity}</span>
        <Button
          variant="secondary"
          size="sm"
          disabled={updating || isMaxStock}
          onClick={() => updateQuantity(item.quantity + 1)}
          className="w-8 h-8 p-0 text-sm"
        >
          +
        </Button>
      </div>

      {/* 小计 */}
      <span className="text-sm font-medium w-20 text-right shrink-0">
        {formatCurrency(subtotal)}
      </span>

      {/* 删除 */}
      <Button
        variant="ghost"
        size="sm"
        disabled={updating}
        onClick={remove}
        className="text-danger hover:text-red-600 shrink-0"
      >
        🗑
      </Button>
    </div>
  );
}
