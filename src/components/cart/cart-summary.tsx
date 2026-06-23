"use client";

// 购物车底部汇总 + 提交订单按钮
// 调用 POST /api/orders 从购物车创建订单

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

interface CartSummaryProps {
  totalAmount: number;
  itemCount: number;
}

export function CartSummary({ totalAmount, itemCount }: CartSummaryProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/orders", { method: "POST" });

      if (res.status === 401) {
        router.push("/login");
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "提交订单失败");
        return;
      }

      // 下单成功 → 跳转到订单详情页
      router.push(`/orders/${data.id}`);
      router.refresh();
    } catch {
      setError("网络错误，请重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-muted-background rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="text-sm text-muted">
        共 <span className="font-medium text-foreground">{itemCount}</span> 件商品，
        合计 <span className="text-lg font-bold text-danger">{formatCurrency(totalAmount)}</span>
      </div>
      <div className="flex flex-col items-end gap-2 w-full sm:w-auto">
        {error && <p className="text-xs text-danger">{error}</p>}
        <Button
          size="lg"
          disabled={itemCount === 0 || loading}
          onClick={handleCheckout}
          className="w-full sm:w-auto"
        >
          {loading ? "提交中..." : "提交订单"}
        </Button>
      </div>
    </div>
  );
}
