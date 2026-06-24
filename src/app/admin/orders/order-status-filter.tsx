"use client";

// 订单状态筛选标签栏
// Client Component：点击切换筛选状态

import Link from "next/link";
import { cn } from "@/lib/utils";
import { ORDER_STATUSES, ORDER_STATUS_LABELS } from "@/lib/constants";

interface StatusCountInfo {
  status: string;
  count: number;
}

interface OrderStatusFilterProps {
  currentStatus?: string;
  statusCounts: StatusCountInfo[];
}

export function OrderStatusFilter({
  currentStatus,
  statusCounts,
}: OrderStatusFilterProps) {
  // 建立 status → count 映射
  const countMap = Object.fromEntries(
    statusCounts.map((s) => [s.status, s.count])
  );

  // 全部订单数
  const totalAll = statusCounts.reduce((sum, s) => sum + s.count, 0);

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {/* 全部 */}
      <Link
        href="/admin/orders"
        className={cn(
          "px-3 py-1.5 rounded-full text-sm border transition-colors",
          !currentStatus
            ? "bg-primary text-white border-primary"
            : "border-border hover:bg-muted-background"
        )}
      >
        全部 ({totalAll})
      </Link>

      {ORDER_STATUSES.map((status) => {
        const count = countMap[status] || 0;
        const isActive = currentStatus === status;

        return (
          <Link
            key={status}
            href={`/admin/orders?status=${status}`}
            className={cn(
              "px-3 py-1.5 rounded-full text-sm border transition-colors",
              isActive
                ? "bg-primary text-white border-primary"
                : "border-border hover:bg-muted-background"
            )}
          >
            {ORDER_STATUS_LABELS[status] || status} ({count})
          </Link>
        );
      })}
    </div>
  );
}
