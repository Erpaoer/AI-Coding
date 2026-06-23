"use client";

// 搜索输入框 —— 带 300ms 防抖，自动更新 URL 参数
// 用于首页商品搜索

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, useRef } from "react";

export function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSearch = searchParams.get("search") || "";
  const [value, setValue] = useState(currentSearch);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 外部 URL 变化时同步到输入框
  useEffect(() => {
    setValue(currentSearch);
  }, [currentSearch]);

  // 防抖更新 URL
  const handleChange = useCallback(
    (newValue: string) => {
      setValue(newValue);

      if (timerRef.current) clearTimeout(timerRef.current);

      timerRef.current = setTimeout(() => {
        const params = new URLSearchParams(searchParams.toString());
        if (newValue.trim()) {
          params.set("search", newValue.trim());
        } else {
          params.delete("search");
        }
        // 搜素条件变化时重置到第 1 页
        params.delete("page");
        router.push(`?${params.toString()}`);
      }, 300);
    },
    [router, searchParams]
  );

  // 组件卸载时清理定时器
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">
        🔍
      </span>
      <input
        type="search"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="搜索商品..."
        className="w-full pl-9 pr-4 py-2.5 border border-border rounded-lg text-sm
                   focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
                   placeholder:text-muted bg-card"
      />
    </div>
  );
}
