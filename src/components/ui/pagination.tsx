"use client";

// 分页导航组件

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

interface PaginationProps {
  page: number;
  totalPages: number;
  className?: string;
}

export function Pagination({ page, totalPages, className }: PaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  const goToPage = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    router.push(`?${params.toString()}`);
  };

  // 生成页码列表（含省略号逻辑）
  const pages: (number | "...")[] = [];
  const range = 2; // 当前页前后各显示多少页
  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= page - range && i <= page + range)
    ) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "...") {
      pages.push("...");
    }
  }

  return (
    <nav
      className={cn("flex items-center justify-center gap-1", className)}
      aria-label="分页导航"
    >
      {/* 上一页 */}
      <button
        onClick={() => goToPage(page - 1)}
        disabled={page <= 1}
        className="px-3 py-1.5 text-sm border border-border rounded-md disabled:opacity-40 hover:bg-muted-background transition-colors"
      >
        ‹ 上一页
      </button>

      {/* 页码 */}
      {pages.map((p, idx) =>
        p === "..." ? (
          <span key={`ellipsis-${idx}`} className="px-2 text-muted text-sm">
            ...
          </span>
        ) : (
          <button
            key={p}
            onClick={() => goToPage(p)}
            className={cn(
              "w-9 h-9 text-sm rounded-md border transition-colors",
              p === page
                ? "bg-primary text-white border-primary"
                : "border-border hover:bg-muted-background"
            )}
          >
            {p}
          </button>
        )
      )}

      {/* 下一页 */}
      <button
        onClick={() => goToPage(page + 1)}
        disabled={page >= totalPages}
        className="px-3 py-1.5 text-sm border border-border rounded-md disabled:opacity-40 hover:bg-muted-background transition-colors"
      >
        下一页 ›
      </button>
    </nav>
  );
}
