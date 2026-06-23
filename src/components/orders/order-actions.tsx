"use client";

// 订单操作按钮 —— 根据当前状态显示可用操作
// PENDING → "去支付" + "取消订单"
// PAID / SHIPPED → "取消订单"
// COMPLETED / CANCELLED → 无操作

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ORDER_TRANSITIONS, ORDER_STATUS_LABELS } from "@/lib/constants";

interface OrderActionsProps {
  orderId: number;
  currentStatus: string;
}

export function OrderActions({ orderId, currentStatus }: OrderActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const allowed = ORDER_TRANSITIONS[currentStatus] ?? [];

  const handleAction = async (targetStatus: string) => {
    // 取消需要确认
    if (targetStatus === "CANCELLED") {
      if (!window.confirm("确定要取消这个订单吗？取消后会恢复商品库存。")) return;
    }

    setLoading(targetStatus);
    setError(null);

    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: targetStatus }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "操作失败");
        return;
      }

      router.refresh();
    } catch {
      setError("网络错误，请重试");
    } finally {
      setLoading(null);
    }
  };

  // 状态流转对应的按钮文案和样式
  const actionConfig: Record<string, { label: string; variant: "primary" | "secondary" | "danger" }> = {
    PAID: { label: "💰 去支付", variant: "primary" },
    SHIPPED: { label: "📦 确认收货", variant: "primary" },
    COMPLETED: { label: "✅ 完成", variant: "primary" },
    CANCELLED: { label: "取消订单", variant: "danger" },
  };

  if (allowed.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        {allowed.map((target) => {
          const config = actionConfig[target] ?? {
            label: target === "CANCELLED" ? "取消订单" : `${ORDER_STATUS_LABELS[target] || target}`,
            variant: target === "CANCELLED" ? "danger" : "primary",
          };

          return (
            <Button
              key={target}
              variant={config.variant as "primary" | "secondary" | "danger"}
              size="sm"
              disabled={loading !== null}
              onClick={() => handleAction(target)}
            >
              {loading === target ? "处理中..." : config.label}
            </Button>
          );
        })}
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
