// 商品网格容器 —— 响应式 CSS Grid 布局
// Server Component

import { cn } from "@/lib/utils";

interface ProductGridProps {
  children: React.ReactNode;
  className?: string;
}

export function ProductGrid({ children, className }: ProductGridProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-4 md:gap-6",
        className
      )}
    >
      {children}
    </div>
  );
}
