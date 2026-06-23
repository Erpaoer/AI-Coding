"use client";

// 分类筛选标签组 —— 点击切换分类，支持"全部"选项
// 用于首页商品筛选

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

interface CategoryItem {
  id: number;
  name: string;
  slug: string;
  _count: { products: number };
}

interface CategoryFilterProps {
  categories: CategoryItem[];
}

export function CategoryFilter({ categories }: CategoryFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get("category") || "";

  const handleClick = (slug: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (slug) {
      params.set("category", slug);
    } else {
      params.delete("category");
    }
    // 分类切换时重置到第 1 页
    params.delete("page");
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {/* "全部"标签 */}
      <button
        onClick={() => handleClick("")}
        className={cn(
          "px-3 py-1.5 text-sm rounded-full border transition-colors",
          currentCategory === ""
            ? "bg-primary text-white border-primary"
            : "border-border hover:border-primary/50 hover:text-primary"
        )}
      >
        全部
      </button>

      {/* 各分类标签 */}
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => handleClick(cat.slug)}
          className={cn(
            "px-3 py-1.5 text-sm rounded-full border transition-colors",
            currentCategory === cat.slug
              ? "bg-primary text-white border-primary"
              : "border-border hover:border-primary/50 hover:text-primary"
          )}
        >
          {cat.name}
          <span className="ml-1 opacity-70">({cat._count.products})</span>
        </button>
      ))}
    </div>
  );
}
