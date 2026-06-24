"use client";

// 搜索 + 分类筛选栏
// Client Component：受控表单，提交时修改 URL searchParams

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface SearchFilterBarProps {
  defaultSearch?: string;
  defaultCategory?: string;
  categories: Category[];
}

export function SearchFilterBar({
  defaultSearch,
  defaultCategory,
  categories,
}: SearchFilterBarProps) {
  const router = useRouter();
  const [search, setSearch] = useState(defaultSearch || "");
  const [category, setCategory] = useState(defaultCategory || "");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (category) params.set("category", category);
    router.push(`/admin/products?${params.toString()}`);
  };

  const handleClear = () => {
    setSearch("");
    setCategory("");
    router.push("/admin/products");
  };

  const hasFilter = (defaultSearch && defaultSearch.length > 0) || (defaultCategory && defaultCategory.length > 0);

  return (
    <form onSubmit={handleSearch} className="flex gap-3 mb-4 flex-wrap">
      <input
        type="text"
        placeholder="搜索商品名称..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="px-3 py-2 border border-border rounded-md text-sm flex-1 min-w-[200px] focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
      />
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white"
      >
        <option value="">全部分类</option>
        {categories.map((cat) => (
          <option key={cat.id} value={cat.slug}>
            {cat.name}
          </option>
        ))}
      </select>
      <Button type="submit" variant="secondary">
        🔍 搜索
      </Button>
      {hasFilter && (
        <Button type="button" variant="ghost" onClick={handleClear}>
          清除筛选
        </Button>
      )}
    </form>
  );
}
