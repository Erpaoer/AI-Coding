"use client";

// 管理员订单操作按钮 —— 显示所有合法的状态流转按钮
// 通过 fetch 调用 /api/admin/orders/[id] 更新状态

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ORDER_TRANSITIONS, ORDER_STATUS_LABELS } from "@/lib/constants";

interface AdminOrderActionsProps {
  orderId: number;
  currentStatus: string;
}

// 状态流转按钮配置
const ACTION_CONFIG: Record<string, { label: string; variant: "primary" | "secondary" | "danger"; note?: string }> = {
  PAID: { label: "💰 标记支付", variant: "primary" },
  SHIPPED: { label: "🚚 标记发货", variant: "primary" },
  COMPLETED: { label: "✅ 完成订单", variant: "secondary" },
  CANCELLED: { label: "❌ 取消订单", variant: "danger", note: "将恢复库存并退款" },
};

export function AdminOrderActions({
  orderId,
  currentStatus,
}: AdminOrderActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const allowed = ORDER_TRANSITIONS[currentStatus] ?? [];

  const handleAction = async (targetStatus: string) => {
    // 取消需要确认
    if (targetStatus === "CANCELLED") {
      const note = ACTION_CONFIG.CANCELLED.note;
      if (!window.confirm(`确定要取消这个订单吗？${note ? `（${note}）` : ""}`)) return;
    }

    setLoading(targetStatus);
    setError(null);

    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
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

  if (allowed.length === 0) {
    return (
      <p className="text-sm text-muted">
        订单已「{ORDER_STATUS_LABELS[currentStatus] || currentStatus}」，无可用操作
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {allowed.map((target) => {
          const config = ACTION_CONFIG[target] ?? {
            label: ORDER_STATUS_LABELS[target] || target,
            variant: "secondary" as const,
          };

          return (
            <Button
              key={target}
              variant={config.variant}
              size="sm"
              disabled={loading !== null}
              onClick={() => handleAction(target)}
              title={config.note}
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
