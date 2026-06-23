// 订单状态彩色标签 —— Server Component
// 不同状态显示不同颜色：待付款(黄) → 已支付(蓝) → 已发货(紫) → 已完成(绿) → 已取消(灰)

import { Badge } from "@/components/ui/badge";
import { ORDER_STATUS_LABELS } from "@/lib/constants";

const STATUS_BADGE_MAP: Record<string, { variant: "default" | "success" | "warning" | "danger" | "info"; label: string }> = {
  PENDING: { variant: "warning", label: ORDER_STATUS_LABELS.PENDING },
  PAID: { variant: "info", label: ORDER_STATUS_LABELS.PAID },
  SHIPPED: { variant: "default", label: ORDER_STATUS_LABELS.SHIPPED },
  COMPLETED: { variant: "success", label: ORDER_STATUS_LABELS.COMPLETED },
  CANCELLED: { variant: "danger", label: ORDER_STATUS_LABELS.CANCELLED },
};

interface OrderStatusBadgeProps {
  status: string;
}

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  const config = STATUS_BADGE_MAP[status] ?? { variant: "default" as const, label: status };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
